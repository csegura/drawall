let canvas = document.getElementById("canvas");
let log = document.getElementById("log");
let colorPicker = document.getElementById("colorPicker");
let undo = document.getElementById("undo");
let touch = document.getElementById("touch");

logger = (msg) => {
  log.prepend(msg + "\n");
  if (log.children.length > 50) {
    log.removeChild(log.lastChild);
  }
};

window.onload = function () {
  let now = new Date();
  let time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
  logger("Loaded drawall.js " + time);

  logger("Detected " + Drawall.isAndroidOrIOS());
  logger("User agent " + navigator.userAgent);

  touch.checked = Drawall.autoDetectTouch();

  let drawAll = new Drawall(canvas, {
    touch: touch.checked,
    guides: true,
  });

  colorPicker.addEventListener("change", (ev) => {
    drawAll.changeColor(ev.target.value);
  });

  window.addEventListener("resize", drawAll.resizeCanvas);

  undo.addEventListener("click", drawAll.undo);

  touch.addEventListener("click", (ev) => {
    drawAll.setTouch(ev.target.checked);
  });

  // events
  drawAll.addEventListener("drawstart", (ev) => {
    logger("DrawStart: " + JSON.stringify(ev.detail, null, 2));
  });

  drawAll.addEventListener("drawend", () => {
    logger("DrawEnd");
  });

  drawAll.addEventListener("log", (ev) => {
    logger("drawAll: " + JSON.stringify(ev.detail, null, 2));
  });
};
