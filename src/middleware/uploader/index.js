import AWS from 'aws-sdk';
import config from '../../config';
import logger from '../logger';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
    accessKeyId: config.aws_access_key_id,
    secretAccessKey: config.aws_secret_access_key
});

class S3Uploader {
	uploadFile(file) {
		try {
			const fileContent = fs.readFileSync(file.path);
			let extension = "png";
			if (file.name.lastIndexOf('.') > -1) {
				extension = file.name.split('.')[1];
			}
			const params = {
				Bucket: 'eventree-bucket',
				Key: `${uuidv4()}.${extension}`,
				Body: fileContent
			};
			
			let s3upload = s3.upload(params).promise();
			return s3upload.then(data => {
				logger.info(`File uploaded successfully. ${data.Location}`);
				return data;
			})
			.catch(err => {
				throw err;
			});
		} catch (err) {
			logger.error("Error uploading to s3 :", err);
			throw err;
		}
	}

	upload64(data) {
		try {
			const { uri, name } = data;
			const base64Data = new Buffer.from(uri.replace(/^data:image\/\w+;base64,/, ""), 'base64');
			const extension = uri.split(';')[0].split('/')[1];
			const params = {
				Bucket: 'eventree-bucket',
				Key: `${uuidv4()}.${extension}`,
				Body: base64Data,
				ACL: 'public-read',
				ContentEncoding: 'base64', // required
				ContentType: `image/${extension}` // required. Notice the back ticks
			}

			let s3upload = s3.upload(params).promise();
			return s3upload.then(data => {
				logger.info(`File uploaded successfully. ${data.Location}`);
				return data;
			})
			.catch(err => {
				throw err;
			});
		} catch (err) {
			logger.error("Error uploading to s3 :", err);
			throw err;
		}
	}
}

const s3uploader = new S3Uploader();
export default s3uploader;