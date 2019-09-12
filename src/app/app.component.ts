import {Component, ElementRef, AfterViewInit, ViewChild} from '@angular/core';
import {fromEvent, Subject} from 'rxjs';
import {CameraService} from './services/camera.service';
import {NoiseService} from './services/noise.service';
import {CityService} from './services/city.service';

@Component({
    selector   : 'app-root',
    templateUrl: './app.component.html',
    styleUrls  : ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
    @ViewChild('canvas', { static: true }) public canvas: ElementRef;

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

        this.pixelSize = 2;
        this.tileSize = 128;

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
                        this.generateTile(i, j, pixelSize * tileSize).subscribe((res) => {
                            this.cx.drawImage(res.image, res.x, res.y);
                        });
                    }
                } else {
                    this.generateTile(i, j, pixelSize * tileSize).subscribe((res) => {
                        this.cx.drawImage(res.image, res.x, res.y);
                    });
                }
            }
        }

    }

    private generateTile(x, y, size) {
        const subject = new Subject<any>();

        this.tileSet[((x % this.tileXcount) + this.tileXcount) % this.tileXcount][((y % this.tileYcount) + this.tileYcount) % this.tileYcount] = {x, y};
        const tile = this.tileSet[((x % this.tileXcount) + this.tileXcount) % this.tileXcount][((y % this.tileYcount) + this.tileYcount) % this.tileYcount];


        const imgData = this.cx.createImageData(this.pixelSize * this.tileSize, this.pixelSize * this.tileSize);

        for (let i = 0; i < this.tileSize; i++) {
            for (let j = 0; j < this.tileSize; j++) {
                const simple = this.Noise.getHeight((x * this.pixelSize * this.tileSize + i * this.pixelSize) / (this.cityService.mapWidth * 1.7),
                    (y * this.pixelSize * this.tileSize + j * this.pixelSize) / (this.cityService.mapWidth * 1.7));

                const color = this.Noise.getColor(simple);
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
            subject.next({image: tile.image, x: x * size, y: y * size});
        });

        return subject;
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
