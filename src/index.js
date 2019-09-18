import React, { Component, Fragment, createRef } from 'react';
import Cropper from 'react-cropper';
import mime from 'mime';
import { Form, Icon, message, Upload } from 'antd';

import ImagePreview from './ImagePreview';
import DataURIToBlob from './DataURIToBlob';

const { Dragger } = Upload;
const initialState = { source: null, fileList: [] };
export default class InputFile extends Component {
	state = initialState;

	cropper = createRef();
	timer = null;

	static getDerivedStateFromProps(props, state) {
		if (!props.value && state.fileList.length > 0) {
			return initialState;
		}

		return null;
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.id != this.props.id) {
			this.setState(initialState);
		}
	}

	crop = () => {
		const { id, onChange } = this.props;
		const base64Url = this.cropper.current.getCroppedCanvas().toDataURL();

		this.timer && clearTimeout(this.timer);
		this.timer = setTimeout(() => {
			const uriToBlobValue = DataURIToBlob(base64Url);
			onChange({ target: { name: id, value: uriToBlobValue } }, id, uriToBlobValue);
		}, 300);
	};

	// Workaround for antd upload functionality
	dummyRequest = ({ file, onSuccess }) => {
		setTimeout(() => {
			onSuccess('ok');
		}, 0);
	};

	getAllowedFileTypes = (selectedType = 'all', isPreview = false) => {
		const { fileType = {} } = this.props;

		if (!fileType.allFilesAreAllowed) {
			if (fileType.allowedFileTypes != null) {
				// Gets the allowed type and append ex: application/pdf, .pdf
				let allowedFileTypes = [];

				fileType.allowedFileTypes.map(d => {
					if (fileType[`${d.value}Options`] !== undefined && fileType[`${d.value}Options`] != null)
						fileType[`${d.value}Options`].map(type => {
							if (selectedType == 'all' || selectedType == 'type') allowedFileTypes.push(type.value);

							if (selectedType == 'all' || selectedType == 'ext')
								allowedFileTypes.push(isPreview ? `${type.label}` : `.${type.label}`);
						});
				});

				if (Array.isArray(allowedFileTypes) && allowedFileTypes.length >= 1) return allowedFileTypes;
			}
		}

		// If blank, accept all types
		return '';
	};

	isFileValid = files => {
		const { fileType = {} } = this.props;
		const allowedFileTypes = this.getAllowedFileTypes('type');

		if (files.type != '') {
			if (
				typeof fileType.allFilesAreAllowed !== 'undefined' &&
				allowedFileTypes != '' &&
				!fileType.allFilesAreAllowed
			) {
				if (!allowedFileTypes.includes(files.type)) {
					message.error(
						`The ${mime.getExtension(
							files.type
						)} file type is not supported, please try again using other file types. `
					);

					return false;
				}
			}
		} else {
			message.error('Invalid file type, it may be corrupted, has no file extension|type or it is not supported.');
			return false;
		}

		return true;
	};

	handleChange = event => {
		if (!this.isFileValid(event.file.originFileObj)) return;

		const { id, onChange, multiple, cropper = {} } = this.props;
		const file = event.file.status != 'removed' ? event.file.originFileObj : null;
		let fileList = event.fileList.filter(f => f.status != 'removed');

		const reader = new FileReader();
		reader.onload = () => {
			this.setState({ source: reader.result });
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
					this.setState({ source: null });
				}
			} else {
				reader.readAsDataURL(file);
			}
		} else {
			// if new file is not an image and source has an image, remove it.
			if (!multiple && this.state.source && file) {
				this.setState({ source: null });
			}
		}

		if (multiple) {
			const newFileList = fileList.map(file => {
				return file.originFileObj;
			});

			onChange({ target: { name: id, value: [...newFileList] } }, id, [...newFileList]);
		} else {
			// If not multiple, Prevent multiple file list and just replace the list with the new one.
			fileList = event.file.status == 'removed' ? [] : [event.file];
			onChange({ target: { name: id, value: [file] } }, id, [file]);
		}

		this.setState({ fileList });
	};

	renderInput = () => {
		const { source, fileList } = this.state;

		const {
			cropper = {},
			disabled = false,
			id,
			onChange,
			required = false,
			multiple,
			preview = true,
			value = []
		} = this.props;

		const { enabled = false, aspectRatio = null } = cropper;
		let newAspectRatio = null;
		if (aspectRatio) {
			const [aspectRatioFirst, aspectRatioSecond] = aspectRatio.split(':');
			newAspectRatio = parseInt(aspectRatioFirst) / parseInt(aspectRatioSecond);
		}

		const allowedFileTypes = this.getAllowedFileTypes('ext');

		return (
			<Fragment>
				{preview && <ImagePreview id={id} images={value} onChange={onChange} />}
				<Dragger
					name={id}
					accept={allowedFileTypes}
					autoComplete="off"
					customRequest={this.dummyRequest}
					fileList={fileList}
					onChange={this.handleChange}
					multiple={multiple}
					required={value.length != 0 ? false : required}
					disabled={disabled}>
					<p className="ant-upload-drag-icon">
						<Icon type="inbox" />
					</p>
					<p className="ant-upload-text">Click or drag file to this area to upload</p>
					{allowedFileTypes !== '' && (
						<p className="ant-upload-hint">
							Supported files types are: {`${this.getAllowedFileTypes('ext', true)}`}
						</p>
					)}
				</Dragger>
				{enabled && source && (
					<Cropper
						ref={this.cropper}
						src={source}
						style={{ height: 350, width: '100%' }}
						aspectRatio={newAspectRatio}
						guides={false}
						cropend={this.crop}
						className={'mt-2'}
					/>
				)}
			</Fragment>
		);
	};

	render() {
		const { label = '', required = false, withLabel = false } = this.props;

		const formItemCommonProps = {
			colon: false,
			label: withLabel ? label : false,
			required
		};

		return <Form.Item {...formItemCommonProps}>{this.renderInput()}</Form.Item>;
	}
}
