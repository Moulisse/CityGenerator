import {Component, ElementRef, AfterViewInit, ViewChild} from '@angular/core';
import {fromEvent} from 'rxjs';
import {CameraService} from './services/camera.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
    @ViewChild('canvas') public canvas: ElementRef;

    constructor(public Camera: CameraService) {
    }

    private cx: CanvasRenderingContext2D;


    ngAfterViewInit() {
        const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
        this.cx = canvasEl.getContext('2d');
        this.cx.canvas.width = window.innerWidth;
        this.cx.canvas.height = window.innerHeight;

        this.Camera.setCamera(this.cx.canvas.width / 2, this.cx.canvas.height / 2);

        // keep sreen ratio even if window is resized
        window.addEventListener('resize', () => {
            const ratio = this.cx.canvas.width / this.cx.canvas.height;
            let canvasHeight = window.innerHeight;
            let canvasWidth = canvasHeight * ratio;
            if (canvasWidth > window.innerWidth) {
                canvasWidth = window.innerWidth;
                canvasHeight = canvasWidth / ratio;
            }
            this.cx.canvas.style.width = canvasWidth + 'px';
            this.cx.canvas.style.height = canvasHeight + 'px';
        }, false);

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

    }

    // private redraw() {
    //     this.cx.resetTransform();
    //     this.cx.fillStyle = '#56b752';
    //     this.cx.fillStyle = '#fff';
    //     this.cx.fillRect(0, 0, this.cx.canvas.width, this.cx.canvas.height);
    //     this.cx.translate(this.camX, this.camY);
    //
    //     const graph = this.cityService.city;
    //
    //     for (const cell of graph.cells) {
    //         if (cell.site.type === 'land') {
    //             this.cx.fillStyle = (this.activeCell && this.activeCell.site.voronoiId === cell.site.voronoiId) ? '#5cc458' : '#56b752';
    //             this.cx.strokeStyle = (this.activeCell && this.activeCell.site.voronoiId === cell.site.voronoiId) ? '#5cc458' : '#56b752';
    //         } else if (cell.site.type === 'hill') {
    //             this.cx.fillStyle = '#968d82';
    //             this.cx.strokeStyle = '#968d82';
    //         } else if (cell.site.type === 'mountain') {
    //             this.cx.fillStyle = '#fff';
    //             this.cx.strokeStyle = '#fff';
    //         }
    //         this.cx.beginPath();
    //         this.cx.moveTo(cell.halfedges[0].edge.va.x, cell.halfedges[0].edge.va.y);
    //         for (const halfedges of cell.halfedges) {
    //             if (cell.site.voronoiId === halfedges.edge.lSite.voronoiId) {
    //                 this.cx.lineTo(halfedges.edge.vb.x, halfedges.edge.vb.y);
    //             } else {
    //                 this.cx.lineTo(halfedges.edge.va.x, halfedges.edge.va.y);
    //             }
    //         }
    //         this.cx.stroke();
    //         this.cx.fill();
    //
    //
    //         // this.cx.beginPath();
    //         // this.cx.fillStyle = (this.activeCell && this.activeCell.site.voronoiId === cell.site.voronoiId) ? '#f00' : '#000';
    //         // this.cx.arc(cell.site.x, cell.site.y, 5, 0, Math.PI * 2, true);
    //         // this.cx.fill();
    //     }
    // }

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
                this.redraw();
            });

        // removes right click
        fromEvent(window, 'contextmenu')
            .subscribe((res: MouseEvent) => {
                res.preventDefault();
            });
    }

}
