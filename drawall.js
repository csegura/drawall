/*!
 * @romheat
 * MIT License
 * https://opensource.org/licenses/MIT
 *
 * Project: Drawall
 * Description: Draw over canvas with touch or pointer events
 * Designed to offer a unified and consistent user experience across various devices, ensuring smooth and responsive painting interactions for users.
 * Version: 1.0.0 (Replace with your library's version number)
 * Author: @romheat
 * Repository: https://github.com/romheat/drawall)
 */
class Drawall extends EventTarget {
  constructor(el, options) {
    super();
    let { touch, guides } = options;
    this.el = el;
    this.touch = touch || Drawall.autoDetectTouch();
    this.guides = guides || false;
    this.ctx = el.getContext("2d");
    this.drawing = false;
    this.points = [];
    this.drawHistory = [];
    this.drawColor = "#000";    
    this.boundingRect = el.getBoundingClientRect();
    this.MAX_LINE_WIDTH = 10;

    this.touchEvents = [
      { event: "touchstart", handler: this.drawStart },
      { event: "touchmove", handler: this.drawMove },
      { event: "touchend", handler: this.drawEnd },
      { event: "touchleave", handler: this.drawEnd },
    ];

    this.pointerEvents = [
      { event: "pointerdown", handler: this.drawStart },
      { event: "pointermove", handler: this.drawMove },
      { event: "pointerup", handler: this.drawEnd },
      { event: "pointercancel", handler: this.drawEnd },
    ];

    this.resizeCanvas();
    this.setTouch(this.touch);
  }

  changeColor = (color) => {
    this.drawColor = color;
    this.log("Color changed to " + color);
  };

  setTouch = (touch) => {
    this.touch = touch;
    if (!touch) {
      this.el.style.touchAction = "none";
    } else {
      this.el.style.touchAction = "";
    }
    this.clearAllEvents();
    this.setEvents(touch ? this.touchEvents : this.pointerEvents);
    this.log("Drawall set to " + (touch ? "touch" : "pointer"));
    this.drawEnd();
  };

  resizeCanvas = () => {
    let parent = this.el.parentElement;
    this.el.width = parent.offsetWidth;
    this.el.height = parent.offsetHeight;
    this.boundingRect = this.el.getBoundingClientRect();
    this.log("Resized canvas to " + this.el.width + "x" + this.el.height);
    this.drawGuideLines();
  };

  clearEvents = (ev) => {
    ev.forEach((e) => {
      this.el.removeEventListener(e.event, e.handler);
    });
  };

  setEvents = (ev) => {
    ev.forEach((e) => {
      this.el.addEventListener(e.event, e.handler);
    });
  };

  clearAllEvents = () => {
    this.clearEvents(this.touchEvents);
    this.clearEvents(this.pointerEvents);
  };

  makeDrawPoint = (x, y, w) => {
    return { x: x, y: y, w: w, c: this.drawColor };
  };

  lastPoint = () => {
    return this.points.at(-1);
  };

  previousPoint = () => {
    return this.points.at(-2);
  };

  hasEnoughtPoints = () => {
    return this.points.length > 3;
  };

  pointerGetCoords = (ev) => {
    return this.makeDrawPoint(
      ev.clientX - this.boundingRect.left,
      ev.clientY - this.boundingRect.top,
      Math.log(ev.pressure + 1)
    );
  };

  touchGetCoords = (ev) => {
    let e = ev.touches ? ev.touches[0] : ev;
    return this.makeDrawPoint(
      e.clientX - this.boundingRect.left,
      e.clientY - this.boundingRect.top,
      Math.log(e.force + 1) || 0.2
    );
  };

  getCoordsAndPresure = (ev) => {
    let coords = this.touch
      ? this.touchGetCoords(ev)
      : this.pointerGetCoords(ev);
    this.log("x: " + coords.x + ", y: " + coords.y + ", w: " + coords.w);
    return coords;
  };

  drawStart = (ev) => {
    this.drawing = true;
    this.points.push(this.getCoordsAndPresure(ev));
    this.log("Start drawing");
    this.dispatchEvent(
      new CustomEvent("drawstart", { detail: this.lastPoint() })
    );
  };

  drawEnd = (ev) => {
    this.drawing = false;
    this.drawHistory.push([...this.points]);
    this.points = [];
    this.log("End drawing");
    this.dispatchEvent(new CustomEvent("drawend"));
  };

  drawMove = (ev) => {
    if (!this.drawing) return;
    ev.preventDefault();
    this.points.push(this.getCoordsAndPresure(ev));
    this.drawOnCanvas();
    this.log("Drawing");
    this.dispatchEvent(
      new CustomEvent("drawmove", { detail: this.lastPoint() })
    );
  };

  drawOnCanvas = () => {
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    let lastPoint = this.lastPoint();

    if (this.hasEnoughtPoints()) {
      const previousPoint = this.previousPoint();
      const xc = (lastPoint.x + previousPoint.x) / 2;
      const yc = (lastPoint.y + previousPoint.y) / 2;
      this.ctx.strokeStyle = previousPoint.c;
      this.ctx.lineWidth = lastPoint.w * this.MAX_LINE_WIDTH;
      this.ctx.quadraticCurveTo(previousPoint.x, previousPoint.y, xc, yc);
      this.ctx.lineTo(xc, yc);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(xc, yc);
      //this.points.push(this.makeDrawPoint(xc, yc, lastPoint.w, lastPoint.c));
    } else {
      this.ctx.beginPath();
      this.ctx.moveTo(lastPoint.x, lastPoint.y);
    }
  };

  clear = () => {
    this.ctx.clearRect(0, 0, this.boundingRect.width, this.boundingRect.height);
    this.drawGuideLines();
  };

  undo = () => {
    if (this.drawHistory.length > 0) {
      this.clear();
      this.drawHistory.pop();
      this.drawHistory.map((points) => {
        this.points = [];
        points.map((point) => {
          this.points.push(point);
          this.drawOnCanvas();
        });
      });
      this.points = [];
    }
  };

  drawGuideLines = () => {
    if (!this.guides) return;

    this.ctx.strokeStyle = "#f00";
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.boundingRect.height / 2);
    this.ctx.lineTo(this.boundingRect.width, this.boundingRect.height / 2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(this.boundingRect.width / 2, 0);
    this.ctx.lineTo(this.boundingRect.width / 2, this.boundingRect.height);
    this.ctx.stroke();

    // write coordinates
    this.ctx.font = "8px Arial";
    this.ctx.fillStyle = "#000";
    this.ctx.fillText("0,0", 0, 12);
   
    this.ctx.fillText(
      Math.round(this.boundingRect.width/2) + "," + Math.round(this.boundingRect.height/2),
      this.boundingRect.width / 2,
      this.boundingRect.height / 2
    );
    this.ctx.stroke();
   
    this.ctx.fillText(
        this.boundingRect.width + "," + this.boundingRect.height,
        this.boundingRect.width-30,
        this.boundingRect.height-5,
        );
//    this.ctx.stroke();
  };

  log = (msg, data) => {
    this.dispatchEvent(
      new CustomEvent("log", { detail: { message: msg, data: data } })
    );
  };
  
  static isAndroidOrIOS = () => {
    if (/android/i.test(navigator.userAgent)) {
      return "Android";
    }
    if (/iPad|iPhone|iPod|Mac/i.test(navigator.userAgent) && !window.MSStream) {
      return "iOS";
    }
    return "Other";
  };

  static autoDetectTouch = () => {
    if (Drawall.isAndroidOrIOS() !== "iOS") {
      return false;
    }
    return true;
  };
}
