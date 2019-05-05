import {Injectable} from '@angular/core';
import {interval, Subject} from 'rxjs';
import {startWith} from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class CameraService {

    public cameraChanged = new Subject<any>();

    // camera position
    public camX: number;
    public camY: number;
    public camZ: number;

    private oldCamX: number;
    private oldCamY: number;

    // mouse position used for camera movement
    private mouseX: number;
    private mouseY: number;

    private camInertiaLoop;
    private camBuffer = [];
    private camBufferIndex = 0;
    private camInertiaRunLoop;

    constructor() {
    }

    setCamera(x, y) {
        [this.camX, this.camY] = [x, y];
        this.cameraChanged.next();
    }

    initMovement(x, y) {
        if (this.camInertiaRunLoop && !this.camInertiaRunLoop.closed) {
            this.camInertiaRunLoop.unsubscribe();
        }
        if (!this.camInertiaLoop || this.camInertiaLoop.closed) {
            this.camInertiaLoop = interval(100).pipe(startWith(0)).subscribe(() => {
                this.camBuffer[this.camBufferIndex] = {x: this.camX, y: this.camY};
                this.camBufferIndex = (this.camBufferIndex + 1) % 5;
            });
        }
        this.mouseX = x;
        this.mouseY = y;
        this.oldCamX = this.camX;
        this.oldCamY = this.camY;
    }

    move(x, y) {
        if (this.mouseX) {
            this.camBuffer[this.camBufferIndex] = {x: this.camX, y: this.camY};
            this.camBufferIndex = (this.camBufferIndex + 1) % 5;
            this.setCamera(this.oldCamX + this.mouseX - x, this.oldCamY + this.mouseY - y);
        }
    }

    endMovement() {
        if (this.camInertiaLoop && !this.camInertiaLoop.closed) {
            let dx = 0;
            let dy = 0;
            for (const point of this.camBuffer) {
                dx += point.x - this.camX;
                dy += point.y - this.camY;
            }
            dx /= this.camBuffer.length;
            dy /= this.camBuffer.length;
            this.startCamInertia(dx, dy);

            this.camInertiaLoop.unsubscribe();
        }
        this.camBuffer = [];
        this.camBufferIndex = 0;
        delete this.mouseX;
    }

    startCamInertia(dx, dy) {
        if (this.camInertiaRunLoop && !this.camInertiaRunLoop.closed) {
            this.camInertiaRunLoop.unsubscribe();
        }

        this.camInertiaRunLoop = interval(1000 / 60).subscribe(() => {
            this.setCamera(this.camX - dx, this.camY - dy);
            dx /= 1.2;
            dy /= 1.2;
            if (Math.hypot(dx, dy) < 1) {
                this.camInertiaRunLoop.unsubscribe();
            }
        });
    }
}
