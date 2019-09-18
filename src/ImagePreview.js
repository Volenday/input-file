import React, { Component, Fragment } from 'react';
import { omit, values } from 'lodash';

import GenerateThumbnail from '@volenday/generate-thumbnail';

export default class ImagePreview extends Component {
	render() {
		let { id, images, onChange } = this.props;
		images = Array.isArray(images) ? images : [images];

		return (
			<div class="clearfix">
				{images.map((d, i) => {
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
													onChange(e, id, values(omit(images, [i])));
												}}>
												<i class="fa fa-times" aria-hidden="true" /> Delete
											</a>
										)}
									</Fragment>
								)}
							</div>
						);
					}
				})}
			</div>
		);
	}
}
