import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';

import config from '../../config';
import logger from '../logger';

class NodemailerSmtpApi {
	constructor() {
		this.transporter = nodemailer.createTransport({
			service: 'gmail',
			host: "smtp.gmail.com",
			port: 465,
			secure: true,
			auth: {
				user: config.mail_sender_email,
				pass: config.mail_sender_password,
			},
		});
	}

	async sendConfirmationEmail(data) {
		const { first_name, last_name, email, activation_code, activation_link } = data;
		let htmlToSend = compileTemplate({ name: `${first_name} ${last_name}`, activation_link: activation_link, activation_code: activation_code, company_name: config.company_name }, './templates/confirm-email.html');
		
		let responseFromEmail = await this.transporter.sendMail({
			from: `"${config.mail_sender_name}" ${config.mail_sender_email}`,
			to: email,
			subject: config.confirm_mail_subject,
			html: htmlToSend,
		});
		
		logger.info(`Message sent: ${responseFromEmail.messageId}`);
		logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(responseFromEmail)}`);
		
		return responseFromEmail;
	}

	async sendResetPasswordMail(data) {
		const { first_name, last_name, email, activation_code, activation_link } = data;
		let htmlToSend = compileTemplate({ name: `${first_name} ${last_name}`, activation_link: activation_link, activation_code: activation_code, company_name: config.company_name }, './templates/reset-password-email.html');
		
		let responseFromEmail = await this.transporter.sendMail({
			from: `"${config.mail_sender_name}" ${config.mail_sender_email}`,
			to: email,
			subject: config.reset_password_mail_subject,
			html: htmlToSend,
		});
		
		logger.info(`Message sent: ${responseFromEmail.messageId}`);
		logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(responseFromEmail)}`);
		
		return responseFromEmail;
	}
}

const readHTMLFile = function(path) {
	try{
		const file = fs.readFileSync(path, {encoding: 'utf-8'});
		return file;
	} catch(ex) {
		logger.error(ex);
		throw ex;
	}
};
  
const compileTemplate = function(replacements, templatePath) {
	const html = readHTMLFile(path.join(__dirname, templatePath));
	const template = handlebars.compile(html);

	const htmlToSend = template(replacements);
	return htmlToSend;
}

const theNodemailer = new NodemailerSmtpApi();
export default theNodemailer;