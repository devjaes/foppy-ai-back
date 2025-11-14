import { IUserRepository } from "@/users/domain/ports/user-repository.port";
import { createHandler } from "@/core/infrastructure/lib/handler.wrapper,";
import {
	LoginRoute,
	RegisterRoute,
	ForgotPasswordRoute,
	ResetPasswordRoute,
} from "@/auth/infrastructure/controllers/auth.routes";
import { hash, verify } from "@/shared/utils/crypto.util";
import { generateToken } from "@/shared/utils/jwt.util";
import { EmailService } from "@/email/application/services/email.service";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { randomBytes } from "crypto";
import { PgSubscriptionRepository } from "@/subscriptions/infrastructure/adapters/subscription.repository";
import { PgPlanRepository } from "@/subscriptions/infrastructure/adapters/plan.repository";

export class AuthService {
	private static instance: AuthService;
	private emailService: EmailService;

	constructor(private readonly userRepository: IUserRepository) {
		this.emailService = EmailService.getInstance();
	}

	public static getInstance(userRepository: IUserRepository): AuthService {
		if (!AuthService.instance) {
			AuthService.instance = new AuthService(userRepository);
		}
		return AuthService.instance;
	}

	login = createHandler<LoginRoute>(async (c) => {
		const { email, password } = c.req.valid("json");

		const user = await this.userRepository.findByEmail(email);
		if (!user || !user.active) {
			return c.json(
				{
					success: false,
					data: null,
					message: "Invalid credentials",
				},
				HttpStatusCodes.BAD_REQUEST
			);
		}

		const isValidPassword = await verify(password, user.passwordHash);
		if (!isValidPassword) {
			return c.json(
				{
					success: false,
					data: null,
					message: "Invalid credentials",
				},
				HttpStatusCodes.BAD_REQUEST
			);
		}

		// Generar token JWT
		const token = await generateToken({
			id: user.id,
			email: user.email,
		});

		return c.json(
			{
				success: true,
				data: {
					id: user.id,
					email: user.email,
					name: user.name,
					username: user.username,
					token,
				},
				message: "Login successful",
			},
			HttpStatusCodes.OK
		);
	});

	register = createHandler<RegisterRoute>(async (c) => {
		const data = c.req.valid("json");

		// Verificar email único
		const existingEmail = await this.userRepository.findByEmail(data.email);
		if (existingEmail) {
			return c.json(
				{
					success: false,
					data: null,
					message: "Email already exists",
				},
				HttpStatusCodes.CONFLICT
			);
		}

		// Verificar username único
		const existingUsername = await this.userRepository.findByUsername(
			data.username
		);
		if (existingUsername) {
			return c.json(
				{
					success: false,
					data: null,
					message: "Username already exists",
				},
				HttpStatusCodes.CONFLICT
			);
		}

		// Crear usuario
		const passwordHash = await hash(data.password);
		const user = await this.userRepository.create({
			name: data.name,
			username: data.username,
			email: data.email,
			passwordHash,
			active: true,
		});

		// Asignar plan demo
		const planRepository = PgPlanRepository.getInstance();
		const subscriptionRepository = PgSubscriptionRepository.getInstance();
		const demoPlan = await planRepository.findByName("demo");
		if (demoPlan) {
			const startDate = new Date();
			const endDate = new Date();
			endDate.setDate(endDate.getDate() + demoPlan.durationDays);
			await subscriptionRepository.create({
				userId: user.id,
				planId: demoPlan.id,
				frequency: demoPlan.frequency,
				startDate,
				endDate,
				active: true,
			});
		}

		// Generar token
		const token = await generateToken({
			id: user.id,
			email: user.email,
		});

		return c.json(
			{
				success: true,
				data: {
					id: user.id,
					email: user.email,
					name: user.name,
					username: user.username,
					token,
				},
				message: "Registration successful",
			},
			HttpStatusCodes.CREATED
		);
	});

	forgotPassword = createHandler<ForgotPasswordRoute>(async (c) => {
		const { email } = c.req.valid("json");

		const user = await this.userRepository.findByEmail(email);
		if (!user || !user.active) {
			return c.json(
				{
					success: false,
					data: null,
					message: "If the email exists, a recovery link will be sent",
				},
				HttpStatusCodes.OK
			);
		}

		const token = randomBytes(32).toString("hex");
		const expires = new Date(Date.now() + 3600000);

		await this.userRepository.setRecoveryToken(user.id, token, expires);

		const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3001"}/reset-password?token=${token}`;

		const emailContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
					.content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
					.button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
					.footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>🔐 FoppyAI</h1>
						<p>Recuperación de Contraseña</p>
					</div>
					<div class="content">
						<h2>Hola ${user.name},</h2>
						<p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en FoppyAI.</p>
						<p>Para continuar con el proceso, haz clic en el siguiente botón:</p>
						<center>
							<a href="${resetLink}" class="button">Restablecer Contraseña</a>
						</center>
						<p>O copia y pega este enlace en tu navegador:</p>
						<p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all;">${resetLink}</p>
						<p><strong>Este enlace expirará en 1 hora.</strong></p>
						<p>Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña permanecerá sin cambios.</p>
					</div>
					<div class="footer">
						<p>© 2025 FoppyAI - Sistema de Gestión Financiera</p>
						<p>Este es un correo automático, por favor no respondas.</p>
					</div>
				</div>
			</body>
			</html>
		`;

		try {
			await this.emailService.sendSimpleEmail(
				email,
				"Recuperación de Contraseña - FoppyAI",
				emailContent,
				{ isHtml: true }
			);
		} catch (error) {
			console.error("Error sending email:", error);
		}

		return c.json(
			{
				success: true,
				data: null,
				message: "If the email exists, a recovery link will be sent",
			},
			HttpStatusCodes.OK
		);
	});

	resetPassword = createHandler<ResetPasswordRoute>(async (c) => {
		const { token, password } = c.req.valid("json");

		const user = await this.userRepository.findByRecoveryToken(token);
		if (!user) {
			return c.json(
				{
					success: false,
					data: null,
					message: "Invalid or expired token",
				},
				HttpStatusCodes.BAD_REQUEST
			);
		}

		if (!user.recoveryTokenExpires || user.recoveryTokenExpires < new Date()) {
			await this.userRepository.clearRecoveryToken(user.id);
			return c.json(
				{
					success: false,
					data: null,
					message: "Token has expired. Please request a new password reset",
				},
				HttpStatusCodes.BAD_REQUEST
			);
		}

		const passwordHash = await hash(password);
		await this.userRepository.update(user.id, { passwordHash });
		await this.userRepository.clearRecoveryToken(user.id);

		return c.json(
			{
				success: true,
				data: null,
				message: "Password has been reset successfully",
			},
			HttpStatusCodes.OK
		);
	});
}
