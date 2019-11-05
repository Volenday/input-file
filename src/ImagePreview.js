import React, { Component, Fragment } from 'react';
import { has, omit, values } from 'lodash';

import GenerateThumbnail from '@volenday/generate-thumbnail';

export default class ImagePreview extends Component {
	render() {
		let { id, images, onChange, source } = this.props;
		images = Array.isArray(images) ? images : [images];

		return (
			<div class="clearfix">
				{images.map((d, i) => {
					// console.log('d: ', d);
					if (typeof d === 'string') {
						const source = GenerateThumbnail(d);
						return (
							<div key={d} style={{ position: 'relative', float: 'left' }}>
								{source.fileName !== 'default.jpg' && (
									<Fragment>
										<a href={source.url} data-lightbox={id} data-title={source.title}>
											<img
												src={source.url}
												width="50px"
												height="50px"
												style={{
													marginRight: 3,
													marginBottom: 3
												}}
												title={source.title}
											/>
										</a>
										{onChange && (
											<a
												href="#"
												style={{
													display: 'block',
													fontSize: 12
												}}
												onClick={e => {
													e.preventDefault();
													const newValues = values(omit(images, [i]));
													onChange({ target: { name: id, value: newValues } }, id, newValues);
												}}>
												<i class="fa fa-times" aria-hidden="true" /> Delete
											</a>
										)}
									</Fragment>
								)}
							</div>
						);
					} else if (typeof d === 'object' && has(d, 'uid')) {
						return (
							<div key={d} style={{ position: 'relative', float: 'left' }}>
								<img
									src={source}
									width="50px"
									height="50px"
									style={{ marginRight: 3, marginLeft: 3 }}
								/>
							</div>
						);
					} else if (typeof d === 'object' && has(d, 'fileName')) {
						return (
							<div key={d} style={{ position: 'relative', float: 'left' }}>
								<a href={d.url} data-lightbox={id} data-title={d.fileName}>
									<img
										src={d.url}
										width="50px"
										height="50px"
										style={{ marginRight: 3, marginLeft: 3 }}
									/>
								</a>
							</div>
						);
					}
				})}
			</div>
		);
	}
}
