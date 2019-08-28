import React, { Component, Fragment, createRef } from 'react';
import InputDate from '@volenday/input-date';
import Cropper from 'react-cropper';
import mime from 'mime';

import ImagePreview from './ImagePreview';

import DataURIToBlob from './DataURIToBlob';

// ant design
import Button from 'antd/es/button';
import Popover from 'antd/es/popover';
import message from 'antd/es/message';
import Upload from 'antd/es/upload';
import Icon from 'antd/es/icon';

const { Dragger } = Upload;
const initialState = { source: null, hasChange: false, isPopoverVisible: false, fileList: [] };
export default class InputFile extends Component {
	state = initialState;

	cropper = createRef();
	timer = null;

	static getDerivedStateFromProps(props, state) {
		if (!props.value && (state.hasChange || state.fileList.length > 0)) {
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
			onChange(id, DataURIToBlob(base64Url));
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

		const { id, action, onChange, multiple, cropper = {} } = this.props;
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

			onChange(id, [...newFileList]);
		} else {
			// If not multiple, Prevent multiple file list and just replace the list with the new one.
			fileList = event.file.status == 'removed' ? [] : [event.file];
			onChange(id, [file]);
		}

		this.setState({ hasChange: action === 'add' ? false : true, fileList });
	};

	renderInput = () => {
		const { source, fileList } = this.state;

		const {
			cropper = {},
			disabled = false,
			id,
			label = '',
			onChange,
			placeholder = '',
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

	handlePopoverVisible = visible => {
		this.setState({ isPopoverVisible: visible });
	};

	renderPopover = () => {
		const { isPopoverVisible } = this.state;
		const { id, label = '', historyTrackValue = '', onHistoryTrackChange } = this.props;

		return (
			<Popover
				content={
					<InputDate
						id={id}
						label={label}
						required={true}
						withTime={true}
						withLabel={true}
						value={historyTrackValue}
						onChange={onHistoryTrackChange}
					/>
				}
				trigger="click"
				title="History Track"
				visible={isPopoverVisible}
				onVisibleChange={this.handlePopoverVisible}>
				<span class="float-right">
					<Button
						type="link"
						shape="circle-outline"
						icon="warning"
						size="small"
						style={{ color: '#ffc107' }}
					/>
				</span>
			</Popover>
		);
	};

	render() {
		const { hasChange } = this.state;
		const { id, action, label = '', required = false, withLabel = false, historyTrack = false } = this.props;

		if (withLabel) {
			if (historyTrack) {
				return (
					<div class="form-group">
						<span class="float-left">
							<label for={id}>{required ? `*${label}` : label}</label>
						</span>
						{hasChange && action !== 'add' && this.renderPopover()}
						{this.renderInput()}
					</div>
				);
			}

			return (
				<div class="form-group">
					<label for={id}>{required ? `*${label}` : label}</label>
					{this.renderInput()}
				</div>
			);
		} else {
			if (historyTrack) {
				return (
					<div class="form-group">
						{hasChange && action !== 'add' && this.renderPopover()}
						{this.renderInput()}
					</div>
				);
			}

			return this.renderInput();
		}
	}
}
