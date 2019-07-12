import React, { Component, Fragment, createRef } from 'react';
import Cropper from 'react-cropper';
import InputDate from '@volenday/input-date';

import DataURIToBlob from './DataURIToBlob';
import ImagePreview from './ImagePreview';

import { Button, Popover } from 'antd';

export default class InputFile extends Component {
	state = { source: null, hasChange: false, isPopoverVisible: false };

	cropper = createRef();
	timer = null;

	static getDerivedStateFromProps(props, state) {
		if (!props.value && state.source) {
			return { source: null };
		}
		return null;
	}

	crop = () => {
		const { id, onChange } = this.props;
		const base64Url = this.cropper.current.getCroppedCanvas().toDataURL();

		this.timer && clearTimeout(this.timer);
		this.timer = setTimeout(() => {
			onChange(id, DataURIToBlob(base64Url));
		}, 300);
	};

	handleChange = event => {
		const { id, onChange } = this.props;

		this.setState({ hasChange: true });

		let files;
		if (event.target) {
			files = event.target.files;
		}

		const reader = new FileReader();
		reader.onload = () => {
			this.setState({ source: reader.result });
		};

		reader.readAsDataURL(files[0]);

		onChange(id, [...files]);
	};

	renderInput = () => {
		const { source } = this.state;

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

		return (
			<Fragment>
				{preview && <ImagePreview id={id} images={value} onChange={onChange} />}
				<input
					type="file"
					name={id}
					autoComplete="off"
					placeholder={placeholder || label || id}
					onChange={this.handleChange}
					multiple={multiple}
					required={value.length != 0 ? false : required}
					disabled={disabled}
					style={{ maxWidth: '100%' }}
				/>
				{enabled && source && (
					<Cropper
						ref={this.cropper}
						src={source}
						style={{ height: 350, width: '100%' }}
						aspectRatio={newAspectRatio}
						guides={false}
						cropend={this.crop}
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
		const { id, label = '', required = false, withLabel = false, historyTrack = false } = this.props;

		if (withLabel) {
			if (historyTrack) {
				return (
					<div class="form-group">
						<span class="float-left">
							<label for={id}>{required ? `*${label}` : label}</label>
						</span>
						{hasChange && this.renderPopover()}
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
						{hasChange && this.renderPopover()}
						{this.renderInput()}
					</div>
				);
			}

			return this.renderInput();
		}
	}
}
