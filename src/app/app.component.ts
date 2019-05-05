import {Component, ElementRef, AfterViewInit, ViewChild} from '@angular/core';
import {fromEvent} from 'rxjs';
import {CameraService} from './services/camera.service';
import {NoiseService} from './services/noise.service';
import {CityService} from './services/city.service';

@Component({
    selector   : 'app-root',
    templateUrl: './app.component.html',
    styleUrls  : ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
    @ViewChild('canvas') public canvas: ElementRef;

    constructor(public cityService: CityService, public Noise: NoiseService, public Camera: CameraService) {
    }

    private cx: CanvasRenderingContext2D;

    tileSet = [];

    pixelSize;
    tileSize;
    tileXcount;
    tileYcount;


    ngAfterViewInit() {
        const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
        this.cx = canvasEl.getContext('2d');
        this.cx.canvas.width = window.innerWidth;
        this.cx.canvas.height = window.innerHeight;


        // initialize variables
        this.Camera.setCamera(0, 0);
        this.Camera.camZ = 1;

        this.pixelSize = 8;
        this.tileSize = 16;

        this.tileXcount = Math.ceil(this.cx.canvas.width / this.pixelSize / this.tileSize) + 1;
        this.tileYcount = Math.ceil(this.cx.canvas.height / this.pixelSize / this.tileSize) + 1;

        for (let i = 0; i <= this.tileXcount; i++) {
            this.tileSet[i] = new Array(this.tileYcount);
        }

        // listeners
        this.cameraMoved();
        this.Camera.cameraChanged.subscribe(() => {
            this.cameraMoved();
        });

        this.captureEvents(canvasEl);
    }

    private cameraMoved() {
        this.redraw();
    }

    private redraw() {
        this.cx.resetTransform();
        this.cx.fillStyle = '#56b752';
        this.cx.fillStyle = '#fff';
        this.cx.fillRect(0, 0, this.cx.canvas.width, this.cx.canvas.height);
        this.cx.translate(Math.round(this.cx.canvas.width / 2 - this.Camera.camX), Math.round(this.cx.canvas.height / 2 - this.Camera.camY));

        const pixelSize = this.pixelSize;
        const tileSize = this.tileSize;

        for (let i = Math.floor((this.Camera.camX - this.cx.canvas.width / 2) / pixelSize / tileSize);
             i < Math.floor((this.Camera.camX - this.cx.canvas.width / 2) / pixelSize / tileSize) + this.tileXcount; i++) {
            for (let j = Math.floor((this.Camera.camY - this.cx.canvas.height / 2) / pixelSize / tileSize);
                 j < Math.floor((this.Camera.camY - this.cx.canvas.height / 2) / pixelSize / tileSize) + this.tileYcount; j++) {

                const tile = this.tileSet[((i % this.tileXcount) + this.tileXcount) % this.tileXcount][((j % this.tileYcount) + this.tileYcount) % this.tileYcount];
                if (tile) {
                    if (tile.x === i && tile.y === j) {
                        if (tile.image) {
                            this.cx.drawImage(tile.image, i * pixelSize * tileSize, j * pixelSize * tileSize);
                        }
                    } else {
                        this.generateTile(i, j).then();
                    }
                } else {
                    this.generateTile(i, j).then();
                }
            }
        }

        // const x = Math.round((this.Camera.camX) / pixelSize / tileSize) * pixelSize * tileSize;
        // const y = Math.round((this.Camera.camY) / pixelSize / tileSize) * pixelSize * tileSize;

        // for (let i = Math.round((this.Camera.camX - this.cx.canvas.width) / pixelSize) * pixelSize; i <= this.Camera.camX + pixelSize * tileSize; i += tileSize * pixelSize) {
        //     for (let j = Math.round((this.Camera.camY - this.cx.canvas.height) / pixelSize) * pixelSize; j <= this.Camera.camY + pixelSize * tileSize; j += tileSize * pixelSize) {
        //         this.generateTile(i, j, pixelSize, tileSize);
        //     }
        // }

    }

    private async generateTile(x, y) {
        this.tileSet[((x % this.tileXcount) + this.tileXcount) % this.tileXcount][((y % this.tileYcount) + this.tileYcount) % this.tileYcount] = {x, y};
        const tile = this.tileSet[((x % this.tileXcount) + this.tileXcount) % this.tileXcount][((y % this.tileYcount) + this.tileYcount) % this.tileYcount];


        const imgData = this.cx.createImageData(this.pixelSize * this.tileSize, this.pixelSize * this.tileSize);

        for (let i = 0; i < this.tileSize; i++) {
            for (let j = 0; j < this.tileSize; j++) {
                const simple = this.Noise.getNoise((x * this.pixelSize * this.tileSize + i * this.pixelSize) / (this.cityService.mapWidth * 1.7),
                    (y * this.pixelSize * this.tileSize + j * this.pixelSize) / (this.cityService.mapWidth * 1.7));

                let color;
                if (simple < 0) {
                    color = [86, 183, 82];
                } else if (simple >= 0 && simple < 0.5) {
                    color = [150, 141, 130];
                } else if (simple >= 0.5) {
                    color = [255, 255, 255];
                }
                for (let k = 0; k < this.pixelSize; k++) {
                    for (let l = 0; l < this.pixelSize; l++) {
                        const n = (i * this.pixelSize + j * this.pixelSize * this.pixelSize * this.tileSize + k + l * this.pixelSize * this.tileSize) * 4;
                        imgData.data[n] = color[0];
                        imgData.data[n + 1] = color[1];
                        imgData.data[n + 2] = color[2];
                        imgData.data[n + 3] = 255;
                    }
                }
            }
        }

        if (!('createImageBitmap' in window)) {
            // Opera and IE polyfill for createImageBitmap
            // @ts-ignore
            window.createImageBitmap = async (blob) => {
                return new Promise((resolve) => {
                    const img = document.createElement('img');
                    img.addEventListener('load', function() {
                        resolve(this);
                    });
                    img.src = URL.createObjectURL(blob);
                });
            };
        }
        createImageBitmap(imgData).then((imgBitmap) => {
            tile.image = imgBitmap;
            this.redraw();
        });

        // for (let j = y - tileSize * pixelSize / 2; j < y + tileSize * pixelSize / 2; j += pixelSize) {
        //     for (let i = x - tileSize * pixelSize / 2; i < x + tileSize * pixelSize / 2; i += pixelSize) {
        //         const simple = this.Noise.getNoise(
        //             (i - pixelSize / 2) / (this.cityService.mapWidth * 1.7),
        //             (j - pixelSize / 2) / (this.cityService.mapHeight * 1.7));
        //
        //         if (simple < 0) {
        //             this.cx.fillStyle = '#56b752';
        //         } else if (simple >= 0 && simple < 0.5) {
        //             this.cx.fillStyle = '#968d82';
        //         } else if (simple >= 0.5) {
        //             this.cx.fillStyle = '#fff';
        //         }
        //         this.cx.fillRect(i - pixelSize / 2, j - pixelSize / 2, pixelSize, pixelSize);
        //     }
        // }
    }

    // event listeners
    private captureEvents(canvasEl: HTMLCanvasElement) {
        fromEvent(canvasEl, 'mousedown')
            .subscribe((res: MouseEvent) => {
                this.Camera.initMovement(res.x, res.y);
            });

        fromEvent(window, 'mouseup')
            .subscribe(() => {
                this.Camera.endMovement();
            });
        fromEvent(window, 'mouseout')
            .subscribe((res: MouseEvent) => {
                if (res.buttons !== 1) {
                    this.Camera.endMovement();
                }
            });

        fromEvent(window, 'mousemove')
            .subscribe((res: MouseEvent) => {
                if (res.buttons === 1) {
                    this.Camera.move(res.x, res.y);
                }
                // this.redraw();
            });

        // removes right click
        fromEvent(window, 'contextmenu')
            .subscribe((res: MouseEvent) => {
                res.preventDefault();
            });
    }

}
