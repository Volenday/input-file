import { validate as uuidValidate } from 'uuid';

const getFileName = fileName => {
	const [fileNameWithoutExtension, extension] = fileName.split('.');
	const fileNameSplit = fileNameWithoutExtension.split('-');
	const fileNameUUID = fileNameSplit.slice(fileNameSplit.length - 5, fileNameSplit.length).join('-');

	const finalFileName = uuidValidate(fileNameUUID)
		? `${fileNameSplit.slice(0, fileNameSplit.length - 5).join('-')}.${extension}`
		: fileName;

	return finalFileName.length > 50
		? finalFileName.substring(0, 50) +
				'...' +
				finalFileName.substring(finalFileName.length - 10, finalFileName.length)
		: finalFileName;
};

export default getFileName;
