import dotenv from 'dotenv';

dotenv.config()

export default {
	app_name: process.env.APP_NAME || 'App',

	env_mode: process.env.ENVIRONMENT,

	hostname: process.env.HOST || 'localhost',
	port: parseInt(process.env.PORT) || 4000,

	db_host: process.env.DB_HOST,
	db_port: process.env.DB_PORT,
	db_name: process.env.DB_NAME,
	db_user: process.env.DB_USER,
	db_pass: process.env.DB_PASS,
	db_dialect: process.env.DB_DIALECT,

	ssl: process.env.ENVIRONMENT == 'production'? process.env.SSL : false,

	mail_sender_name: process.env.MAIL_SENDER_NAME || '',
	mail_sender_email: process.env.MAIL_SENDER_EMAIL || '',
	mail_sender_password: process.env.MAIL_SENDER_PASSWORD || '',
	confirm_mail_subject: process.env.CONFIRM_MAIL_SUBJECT || 'PLEASE CONFIRM YOUR EMAIL',
  reset_password_mail_subject: process.env.RESET_PASSWORD_MAIL_SUBJECT || 'RESET PASSWORD',

	redis_host: process.env.REDIS_HOST,
	redis_port: process.env.REDIS_PORT,
	redis_pass: process.env.REDIS_PASS,

	secret_key: process.env.SECRET_KEY || '',
	token_expiresin: process.env.TOKEN_EXPIRESIN || '30m',
	refresh_token_expiresin: process.env.REFRESH_TOKEN_EXPIRESIN || '12h',

	server_root_url: process.env.SERVER_ROOT_URL || '',
	web_root_url: process.env.WEB_ROOT_URL || '',
	
	activation_code_digit: parseInt(process.env.ACTIVATION_CODE_DIGIT) || 6,
	activation_code_expiresin: parseInt(process.env.ACTIVATION_CODE_EXPIRESIN) || 86400,
	activation_link_url: process.env.ACTIVATION_LINK_URL || 'activate',
	reset_password_link_url: process.env.RESET_PASSWORD_LINK_URL || 'resetpassword',
	 
	company_name: process.env.COMPANY_NAME || '',

	aws_access_key_id: process.env.AWS_ACCESS_KEY_ID || '',
	aws_secret_access_key: process.AWS_SECRET_ACCESS_KEY || '',

	default_avatar: 'https://s3.amazonaws.com/37assets/svn/765-default-avatar.png',

	stripe_key: process.env.STRIPE_KEY || '',

	service_fee: parseInt(process.env.SERVICE_FEE) || 5,

	firebase_url: process.env.FIREBASE_DATA_URL || ''
}