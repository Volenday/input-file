import React, { useEffect, useState, useRef } from 'react';
import Cropper from 'react-cropper';
import mime from 'mime';
import { Form, message, Skeleton } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { has, size } from 'lodash';
import GenerateThumbnail from '@volenday/generate-thumbnail';

import DataURIToBlob from './DataURIToBlob';
import getFileName from './getFileName';

const browser = typeof window !== 'undefined' ? true : false;

const InputFile = props => {
	const [source, setSource] = useState(null);
	const [fileList, setFileList] = useState([]);

	const cropperRef = useRef();
	const timer = null;

	useEffect(() => {
		setSource(null);
		setFileList([]);
	}, [props.id]);

	const crop = () => {
		const { id, onChange } = props;
		const base64Url = cropperRef.current.getCroppedCanvas().toDataURL();

		timer && clearTimeout(timer);
		timer = setTimeout(() => {
			const uriToBlobValue = DataURIToBlob(base64Url);
			onChange({ target: { name: id, value: uriToBlobValue } }, id, uriToBlobValue);
		}, 300);
	};

	// Workaround for antd upload functionality
	const dummyRequest = ({ file, onSuccess }) => {
		setTimeout(() => {
			onSuccess('ok');
		}, 0);
	};

	const getAllowedFileTypes = (selectedType = 'all', isPreview = false) => {
		const { fileType = {} } = props;

		if (!fileType.allFilesAreAllowed) {
			if (fileType.allowedFileTypes != null) {
				// Gets the allowed type and append ex: application/pdf, .pdf
				let allowedFileTypes = [];

				fileType.allowedFileTypes.map(d => {
					if (fileType[`${d.value}Options`] !== undefined && fileType[`${d.value}Options`] != null)
						fileType[`${d.value}Options`].map(type => {
							if (selectedType == 'all' || selectedType == 'type') {
								if (type.label !== 'bmp') {
									allowedFileTypes.push(type.value);
								}
							}
							if (selectedType == 'all' || selectedType == 'ext')
								if (type.label !== 'bmp') {
									allowedFileTypes.push(isPreview ? `${type.label}` : `.${type.label}`);
								}
						});
				});
				if (Array.isArray(allowedFileTypes) && allowedFileTypes.length >= 1) return allowedFileTypes;
			}
		}

		// If blank, accept all types
		return '';
	};

	const isFileValid = files => {
		const { fileType = {} } = props;
		const allowedFileTypes = getAllowedFileTypes('type');

		if (files.type !== '' || files.name.includes('.keystore')) {
			if (
				typeof fileType.allFilesAreAllowed !== 'undefined' &&
				allowedFileTypes != '' &&
				!fileType.allFilesAreAllowed
			) {
				if (!allowedFileTypes.includes(files.type)) {
					return {
						message: `The ${mime.getExtension(
							files.type
						)} file type is not supported, please try again using other file types. `,
						status: false
					};
				}
			}
		} else {
			return {
				message: 'Invalid file type, it may be corrupted, has no file extension|type or it is not supported.',
				status: false
			};
		}

		return { status: true };
	};

	let tempFileList = [];
	const handleChange = event => {
		if (!has(event.file.originFileObj)) {
			if (event.file.type) {
				const isValid = isFileValid(event.file);
				if (!isValid.status) return message.error(isValid.message);
			}
		} else {
			const isValid = isFileValid(event.file.originFileObj);
			if (event.file.status === 'done' || !isValid.status) return message.error(isValid.message);
		}

		const { id, onChange, multiple, cropper = {} } = props;
		const file = event.file.status != 'removed' ? event.file.originFileObj : null;
		let fileList = event.fileList.filter(f => f.status != 'removed');

		if (event.file.status !== 'removed') {
			tempFileList.push({ fileName: event.file.name, originFileObj: event.file.originFileObj });
			tempFileList = tempFileList.filter(f => typeof f.fileName !== 'undefined');
		}

		const reader = new FileReader();
		reader.onload = () => {
			setSource(reader.result);
		};

		// Only show cropper if mimeType is image
		if (`${event.file.type}`.startsWith('image/') && cropper.enabled) {
			if (multiple) {
				// Replace the cropper source with the next file if it is also an image.
				const newSourceFile = fileList
					.filter(f => {
						return `${f.type}`.startsWith('image/') && f.status != 'removed';
					})
					.pop();

				// Read the last image from the list
				if (newSourceFile) {
					reader.readAsDataURL(newSourceFile.originFileObj);
				} else {
					setSource(null);
				}
			} else {
				reader.readAsDataURL(file);
			}
		} else {
			// if new file is not an image and source has an image, remove it.
			if (!multiple && source && file) {
				setSource(null);
			}
		}

		if (multiple) {
			const newFileList = fileList.map(file => {
				if (!has(file, 'originFileObj')) {
					const tempFile = tempFileList.find(f => f.name === file.name);
					if (typeof tempFile !== 'undefined') tempFile.originFileObj;
				}

				const tempFile = tempFileList.find(f => f.fileName === file.name);
				return typeof tempFile === 'undefined' ? file.originFileObj : tempFile.originFileObj;
			});

			onChange(
				{ target: { name: id, value: newFileList.length ? [...newFileList] : null } },
				id,
				newFileList.length ? [...newFileList] : null,
				fileList.map(d => d.status)
			);
			setFileList([...newFileList]);
		} else {
			// If not multiple, Prevent multiple file list and just replace the list with the new one.
			fileList = event.file.status == 'removed' ? [] : [event.file];
			onChange({ target: { name: id, value: [file] } }, id, [file], [event.file.status]);
			setFileList(fileList);
		}
	};

	const handleTransformFile = file => {
		const { multiple } = props;

		const source = GenerateThumbnail(file);

		setTimeout(() => {
			setFileList(
				fileList.map(f => {
					if (multiple) {
						if (file.name === f.name) {
							f.url = source.url;
						}
					} else {
						f.url = source.url;
					}

					return f;
				})
			);
		}, 1000);
	};

	const renderInput = () => {
		const { Upload } = require('antd');

		const { Dragger } = Upload;

		const {
			cropper = {},
			disabled = false,
			id,
			multiple,
			onRemove,
			pastedFile,
			required = false,
			value = []
		} = props;

		let newFileList = [];

		if (Array.isArray(pastedFile) && !pastedFile.includes(null)) {
			pastedFile.map((d, i) => {
				if (typeof d.name !== 'undefined' && d.name !== '') {
					let thumb = '';

					if (d.mimeType) {
						if (d.mimeType.startsWith('image/')) thumb = d.thumbUrl;
						else thumb = GenerateThumbnail(d.url).url;
					}

					if (d.type) {
						if (d.type.startsWith('image/')) thumb = d.thumbUrl;
						else thumb = GenerateThumbnail(d.url).url;
					}

					newFileList.push({
						uid: i,
						name: getFileName(d.name),
						status: 'done',
						url: d.url,
						thumbUrl: thumb,
						type: d.type,
						originFileObj: {
							uid: i,
							name: d.name,
							status: 'done',
							url: d.url,
							thumbUrl: thumb,
							type: d.type
						}
					});
				}
			});
		}

		if (Array.isArray(value) && value.includes(null)) {
			newFileList = value.filter(d => d);
		} else {
			if (!multiple && size(value[0]) && !fileList.length) {
				const onlyValue = value[0];
				const hasUrl = onlyValue.url ? true : false;

				if (typeof onlyValue.fileName !== 'undefined' && onlyValue.fileName !== '') {
					let thumb = '';

					if (onlyValue.mimeType && hasUrl) {
						if (onlyValue.mimeType.startsWith('image/')) thumb = onlyValue.thumbUrl;
						else thumb = GenerateThumbnail(onlyValue.url).url;
					}

					if (onlyValue.type && hasUrl) {
						if (onlyValue.type.startsWith('image/')) thumb = onlyValue.thumbUrl;
						else thumb = GenerateThumbnail(onlyValue.url).url;
					}

					newFileList.push({
						uid: 1,
						name: getFileName(onlyValue.fileName),
						status: 'done',
						url: hasUrl ? onlyValue.url : '',
						thumbUrl: thumb,
						type: onlyValue.mimeType,
						originFileObj: {
							uid: 1,
							name: onlyValue.fileName,
							status: 'done',
							url: hasUrl ? onlyValue.url : '',
							thumbUrl: thumb,
							type: onlyValue.mimeType
						}
					});
				} else if (onlyValue.name !== '' && typeof onlyValue.name !== 'undefined') {
					let thumb = '';

					if (onlyValue.mimeType && hasUrl) {
						if (onlyValue.mimeType.startsWith('image/')) thumb = onlyValue.thumbUrl;
						else thumb = GenerateThumbnail(onlyValue.url).url;
					}

					if (onlyValue.type && hasUrl) {
						if (onlyValue.type.startsWith('image/')) thumb = onlyValue.thumbUrl;
						else thumb = GenerateThumbnail(onlyValue.url).url;
					}

					newFileList.push({
						uid: 1,
						name: getFileName(onlyValue.name),
						status: 'done',
						url: hasUrl ? onlyValue.url : '',
						thumbUrl: thumb,
						type: onlyValue.type,
						originFileObj: {
							uid: 1,
							name: onlyValue.name,
							status: 'done',
							url: hasUrl ? onlyValue.url : '',
							thumbUrl: thumb,
							type: onlyValue.type
						}
					});
				}
			} else if (multiple && value && value.length !== 0) {
				value.map((d, i) => {
					const hasUrl = d.url ? true : false;

					if (typeof d.fileName !== 'undefined' && d.fileName !== '') {
						let thumb = '';

						if (d.mimeType && hasUrl) {
							if (d.mimeType.startsWith('image/')) thumb = d.thumbUrl;
							else thumb = GenerateThumbnail(d.url).url;
						}

						if (d.type && hasUrl) {
							if (d.type.startsWith('image/')) thumb = d.thumbUrl;
							else thumb = GenerateThumbnail(d.url).url;
						}

						newFileList.push({
							uid: i,
							name: getFileName(d.fileName),
							status: 'done',
							url: hasUrl ? d.url : '',
							thumbUrl: thumb,
							type: d.mimeType,
							originFileObj: {
								uid: 1,
								name: d.fileName,
								status: 'done',
								url: hasUrl ? d.url : '',
								thumbUrl: thumb,
								type: d.mimeType
							}
						});
					} else if (d.name && d.name !== '') {
						let thumb = '';

						if (d.mimeType && hasUrl) {
							if (d.mimeType.startsWith('image/')) thumb = d.thumbUrl;
							else thumb = GenerateThumbnail(d.url).url;
						}

						if (d.type && hasUrl) {
							if (d.type.startsWith('image/')) thumb = d.thumbUrl;
							else thumb = GenerateThumbnail(d.url).url;
						}

						newFileList.push({
							uid: i,
							name: getFileName(d.name),
							status: 'done',
							url: hasUrl ? d.url : '',
							thumbUrl: thumb,
							type: d.type,
							originFileObj: {
								uid: 1,
								name: d.name,
								status: 'done',
								url: hasUrl ? d.url : '',
								thumbUrl: thumb,
								type: d.type
							}
						});
					}
				});
			} else {
				newFileList = fileList;
			}
		}

		const { enabled = false, aspectRatio = null } = cropper;
		let newAspectRatio = null;
		if (aspectRatio) {
			const [aspectRatioFirst, aspectRatioSecond] = aspectRatio.split(':');
			newAspectRatio = parseInt(aspectRatioFirst) / parseInt(aspectRatioSecond);
		}

		let allowedFileTypes = getAllowedFileTypes('ext');
		if (Array.isArray(allowedFileTypes) && allowedFileTypes.includes('.jpeg/jpg')) {
			allowedFileTypes = allowedFileTypes.filter(type => type !== '.jpeg/jpg');
			allowedFileTypes = ['.jpeg', '.jpg', ...allowedFileTypes];
		}

		return (
			<>
				<Dragger
					accept={typeof allowedFileTypes === 'string' ? allowedFileTypes : allowedFileTypes.join(',')}
					autoComplete="off"
					customRequest={dummyRequest}
					disabled={disabled}
					fileList={[...newFileList]}
					listType="picture"
					multiple={multiple}
					name={id}
					onChange={handleChange}
					onRemove={onRemove}
					required={value ? (value.length != 0 ? false : required) : required}
					transformFile={handleTransformFile}>
					<p className="ant-upload-drag-icon">
						<InboxOutlined />
					</p>
					<p className="ant-upload-text">Click or drag file to this area to upload</p>
					{allowedFileTypes !== '' && (
						<p className="ant-upload-hint">
							Supported files types are: {`${getAllowedFileTypes('ext', true).join(', ')}`}
						</p>
					)}
				</Dragger>
				{enabled && source && (
					<Cropper
						ref={cropperRef}
						src={source}
						style={{ height: 350, width: '100%' }}
						aspectRatio={newAspectRatio}
						guides={false}
						cropend={crop}
						className={'mt-2'}
						zoomOnWheel={false}
					/>
				)}
			</>
		);
	};

	const { error = null, extra = null, inlineError = true, label = '', required = false, withLabel = false } = props;

	let formItemCommonProps = {
		colon: false,
		label: withLabel ? (
			<>
				<div style={{ float: 'right' }}>{extra}</div> <span class="label">{label}</span>
			</>
		) : (
			false
		),
		required,
		validateStatus: error ? 'error' : 'success'
	};
	if (inlineError) formItemCommonProps = { ...formItemCommonProps, help: error ? error : '' };

	return (
		<Form.Item {...formItemCommonProps}>
			{browser ? renderInput() : <Skeleton active paragraph={{ rows: 1, width: '100%' }} title={false} />}
		</Form.Item>
	);
};

export default InputFile;
