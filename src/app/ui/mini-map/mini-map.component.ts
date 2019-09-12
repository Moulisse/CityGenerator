import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CityService} from '../../services/city.service';
import {NoiseService} from '../../services/noise.service';
import {CameraService} from '../../services/camera.service';

@Component({
    selector: 'app-mini-map',
    templateUrl: './mini-map.component.html',
    styleUrls: ['./mini-map.component.scss']
})
export class MiniMapComponent implements OnInit {
    @ViewChild('miniMap', { static: true }) public canvas: ElementRef;

    private cx;
    private size = 220;

    constructor(public Camera: CameraService, public Noise: NoiseService, public cityService: CityService) {
    }

    ngOnInit() {
        const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
        canvasEl.width = this.size;
        canvasEl.height = this.size;
        this.cx = canvasEl.getContext('2d');
        this.cx.canvas.style.width = this.size + 'px';
        this.cx.canvas.style.height = this.size + 'px';

        this.loadMap();
        this.Camera.cameraChanged.subscribe(() => {
            this.loadMap();
        });
    }

    loadMap() {
        const map = this.cx.createImageData(this.size, this.size);

        for (let i = 0; i < map.data.length; i += 4) {
            const x = i / 4 % this.size;
            const y = Math.floor(i / 4 / this.size);

            let realX = 2 * (this.cityService.mapWidth - 5) * (x / this.size) - (this.cityService.mapWidth - 5);
            let realY = 2 * (this.cityService.mapHeight - 5) * (y / this.size) - (this.cityService.mapHeight - 5);

            realX += this.Camera.camX;
            realY += this.Camera.camY;

            const simple = this.Noise.getHeight(realX / (this.cityService.mapWidth * 1.7), realY / (this.cityService.mapHeight * 1.7));

            const color = this.Noise.getColor(simple);

            map.data[i + 3] = 255;
            map.data[i] = color[0];
            map.data[i + 1] = color[1];
            map.data[i + 2] = color[2];
        }
        this.cx.putImageData(map, 0, 0);
    }

}
