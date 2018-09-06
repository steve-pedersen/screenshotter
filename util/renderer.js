// borrowed and edited from https://github.com/zenato/puppeteer-renderer 

'use strict';

const puppeteer = require('puppeteer');
const fs = require('fs');
const pathModule = require('path');

class Renderer {
	constructor(browser) {
		this.browser = browser;
	}

// 'networkidle2' - consider navigation to be finished when there are no more than 2 network connections for at least 500 ms
	async createPage(url, options = {}, extraHeaders = {}) {
		const { timeout, waitUntil } = options;
		const page = await this.browser.newPage();

		page.setExtraHTTPHeaders(extraHeaders);

		const response = await page.goto(url, {							// This line takes a couple seconds to complete...
			timeout: Number(timeout) || 30 * 1000,
			waitUntil: waitUntil || 'networkidle2',
		});

		console.log('REQUEST HEADERS:    ', response.request().headers());

		console.log('Renderer: line 20. Puppeteer has connected to the requested URL.');
		return page;
	}

	async render(url, options = {}) {
		let page = null;
		try {
			const { timeout, waitUntil } = options;
			page = await this.createPage(url, { timeout, waitUntil });
			const html = await page.content();
			return html;
		} finally {
			if (page) {
				await page.close();
			}
		}
	}

	async pdf(url, options = {}) {
		let page = null;
		try {
			const { timeout, waitUntil, ...extraOptions } = options;
			page = await this.createPage(url, { timeout, waitUntil });

			const { scale, displayHeaderFooter, printBackground, landscape } = extraOptions;
			const buffer = await page.pdf({
				...extraOptions,
				scale: Number(scale),
				displayHeaderFooter: displayHeaderFooter === 'true',
				printBackground: printBackground === 'true',
				landscape: landscape === 'true',
			});
			return buffer;
		} finally {
			if (page) {
				await page.close();
			}
		}
	}

	async screenshot(url, options = {}) {
		console.log('in async screenshot from Renderer');
		let page = null;
		try {
			var { timeout, waitUntil, ...extraOptions } = options;

			page = await this.createPage(url, { timeout, waitUntil });
			page.setViewport({
				width: Number(extraOptions.width || 800),
				height: Number(extraOptions.height || 600),
			});

			var { fullpage, omitbackground, type, quality, clip } = extraOptions;
			if (clip) {
				extraOptions.clip = this.parseKeyVal(clip);
			}
			if (!quality) {
				if (type === undefined) { 
					quality = 100; 
					type = 'jpeg';
				}
				else if (type == 'png') { quality = 0; }
			}

			var path = extraOptions.path;
			delete extraOptions.path;
			
			console.log('Renderer: line 75. Path is:  ' + path);
			
			const buffer = await page.screenshot({
				// ...extraOptions,
				path: path,
				type: type || 'jpeg',
				quality: Number(quality),
				fullPage: (fullpage === 'true'),
				omitBackground: (omitbackground === 'true'),
			});
			console.log('Renderer: line 86');
			return buffer;
		} finally {
			if (page) {
				await page.close();
				console.log('Renderer: line 88');
			}
		}
	}

	async close() {
		await this.browser.close();
	}

	// Note, all values are cast to be a Number
	parseKeyVal(objStr) {
		let obj = {};
		let arr = objStr.split(',');
		arr.forEach(function(element, i) {
			let em = element.split('=');
			obj[em[0]] = Number(em[1]);
		});
		return obj;
	}
}

// https://github.com/GoogleChrome/puppeteer/blob/v1.7.0/docs/api.md#puppeteerlaunchoptions
async function create() {
	const options = {
		ignoreHTTPSErrors: false,
		defaultViewport: {
			width: 800,
			height: 600,
			isLandscape: true,
			deviceScaleFactor: 1,
			isMobile: false,
			hasTouch: false
		},
		args: ['--no-sandbox'],
	};
	const browser = await puppeteer.launch( options );

	return new Renderer(browser);
}

module.exports = create;