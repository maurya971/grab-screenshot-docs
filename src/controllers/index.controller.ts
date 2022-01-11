import express from 'express';
import { Controller, Get, Query, Route, Request } from 'tsoa';
import FfmpegCommand from 'fluent-ffmpeg';
import * as fs from 'fs';
import { exec } from 'child_process';

/**
 * Helper function to take screenshot
 * @param url 
 * @param timestamp 
 * @param next 
 */
const _takeScreenshot = async (url: any, timestamp: any, next: any) => {
    await FfmpegCommand.ffprobe(url, (err, metadata) => {
        if (!metadata ||
            !metadata.format ||
            !metadata.format.duration ||
            timestamp >= metadata.format.duration) {
            timestamp = 0;
        }
        FfmpegCommand(url)
            .screenshots({
                timestamps: [timestamp],
                filename: '%d.png',
                folder: 'temp/'
            }).on('end', () => {
                console.log('Screenshot taken');
                const imageAsBase64 = fs.readFileSync('temp/1.png', 'base64');
                const base64Data = imageAsBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
                const img = Buffer.from(base64Data, 'base64');
                next(img);
            });
    });
}

@Route('image')
export class IndexController extends Controller {
    @Get('')
    public async index(@Request() request: express.Request, @Query() url: string, @Query() timestamp: number) {
        const response = (<any>request).res as express.Response;
        return await new Promise((resolve, reject) => {
            _takeScreenshot(url, timestamp, async (img: any) => {
                response.writeHead(200, {
                    'Content-Type': 'image/png',
                    'Content-Length': img.length
                });
                response.end(img);
                resolve(true);
            });
        });
    }

    @Get('/v2')
    public async msg(@Request() request: express.Request, @Query() url: string, @Query() timestamp: number) {
        //return { msg: 'This is a message from controller' };
        const response = (<any>request).res as express.Response;
        if (!timestamp || !url) {
            response.status(401).send('Either timestamp or url is wrong');
        }
        return await new Promise((resolve, reject) => {
            exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${url}`, function (err, stdout, stderr) {
                if (Number(timestamp) >= Number(stdout)) {
                    timestamp = 0;
                }
                exec(`ffmpeg -ss ${timestamp} -i ${url} -vframes 1 -vcodec png -an -y temp/%d.png`, function (err) {
                    const imageAsBase64 = fs.readFileSync('temp/1.png', 'base64');
                    const base64Data = imageAsBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
                    const img = Buffer.from(base64Data, 'base64');
                    response.writeHead(200, {
                        'Content-Type': 'image/png',
                        'Content-Length': img.length
                    });
                    response.end(img);
                    resolve(true);
                });
            });
        });
    }
}