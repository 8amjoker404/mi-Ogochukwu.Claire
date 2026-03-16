(function () {
  const green = '#62D2A2';
  const pink = '#DD5B82';
  const size = 30;
  const speed = 0.07;

  const shape = [
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0]
  ];

  const heartShape = [
    [0, 1, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0]
  ];

  let haveKissed = false;
  let loveScreenShown = false;
  let sceneWidth = 800;
  let sceneHeight = 800;

  const Bodies = Matter.Bodies;
  const Body = Matter.Body;
  const Composite = Matter.Composite;
  const Common = Matter.Common;
  const Constraint = Matter.Constraint;
  const Engine = Matter.Engine;
  const Render = Matter.Render;
  const Events = Matter.Events;
  const World = Matter.World;
  const MouseConstraint = Matter.MouseConstraint;
  const Mouse = Matter.Mouse;

  const engine = Engine.create();
  engine.enableSleeping = true;

  const world = engine.world;
  Engine.run(engine);

  const canvas = document.createElement("canvas");
  canvas.width = sceneWidth;
  canvas.height = sceneHeight;

  const mouseConstraint = MouseConstraint.create(engine, {
    mouse: Mouse.create(canvas)
  });

  const ground = Bodies.rectangle(
    sceneWidth / 2,
    sceneHeight + sceneHeight / 2,
    Math.max(sceneWidth * 4, 2000),
    sceneHeight,
    {
      isStatic: true,
      render: {
        opacity: 1,
        fillStyle: "#D7FBE8",
        strokeStyle: "#D7FBE8"
      }
    }
  );

  World.add(world, [mouseConstraint, ground]);

  function connect(c, bodyA, bodyB, constraintOptions) {
    if (bodyA && bodyB) {
      Composite.addConstraint(
        c,
        Constraint.create(
          Common.extend(
            {
              bodyA,
              bodyB
            },
            constraintOptions
          )
        )
      );
    }
  }

  function softSkeleton(xx, yy, matrix, particleRadius, constraintOptions, callback) {
    const c = Composite.create({ label: "Skeleton" });
    let y = 0;
    let lastRow = null;

    constraintOptions = constraintOptions || { stiffness: 0.95 };

    callback =
      callback ||
      function (x, y, size) {
        return Bodies.rectangle(x, y, size, size);
      };

    for (let i = 0; i < matrix.length; i++) {
      const row = matrix[i];
      let x = 0;

      for (let j = 0; j < row.length; j++) {
        if (row[j]) {
          row[j] = callback(
            xx + x * particleRadius,
            yy + y * particleRadius,
            particleRadius,
            i,
            j
          );

          Composite.addBody(c, row[j]);
          connect(c, row[j - 1], row[j], constraintOptions);

          if (lastRow) {
            connect(c, row[j], lastRow[j], constraintOptions);
            connect(c, row[j], lastRow[j + 1], constraintOptions);
            connect(c, row[j], lastRow[j - 1], constraintOptions);
          }
        }
        x++;
      }

      y++;
      lastRow = row;
    }

    return c;
  }

  function createLoveMessage() {
    if (document.getElementById("loveMessage")) return;

    const style = document.createElement("style");
    style.innerHTML = `
      .loveMessage {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(9, 4, 17, 0.55);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.8s ease, visibility 0.8s ease;
        z-index: 9999;
        padding: 20px;
      }

      .loveMessage.show {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }

      .loveCard {
        position: relative;
        width: min(92vw, 560px);
        padding: 34px 26px;
        border-radius: 30px;
        text-align: center;
        color: #fff;
        background: linear-gradient(135deg, rgba(221,91,130,0.96), rgba(95,20,60,0.96));
        box-shadow: 0 20px 60px rgba(0,0,0,0.35), 0 0 35px rgba(255,105,180,0.22);
        transform: scale(0.86) translateY(20px);
        transition: transform 0.7s ease;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.22);
        cursor: pointer;
      }

      .loveMessage.show .loveCard {
        transform: scale(1) translateY(0);
      }

      .loveCard h1 {
        margin: 0 0 12px;
        font-size: clamp(28px, 5vw, 44px);
        line-height: 1.1;
      }

      .loveCard p {
        margin: 0;
        font-size: clamp(16px, 2.4vw, 22px);
        line-height: 1.7;
        color: #fff6fa;
      }

      .loveCard .loveSub {
        margin-top: 16px;
        display: inline-block;
        color: #ffe1ee;
        font-size: clamp(14px, 2vw, 18px);
        opacity: 0.95;
      }

      .loveCard .tapBack {
        margin-top: 18px;
        display: block;
        font-size: 14px;
        color: rgba(255,255,255,0.82);
        letter-spacing: 0.4px;
      }

      .floating-heart {
        position: absolute;
        bottom: -10px;
        font-size: 18px;
        opacity: 0;
        animation: floatHeart 3.5s linear forwards;
        pointer-events: none;
      }

      @keyframes floatHeart {
        0% {
          transform: translateY(0) scale(0.8);
          opacity: 0;
        }
        15% {
          opacity: 1;
        }
        100% {
          transform: translateY(-220px) scale(1.3);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    const wrap = document.createElement("div");
    wrap.className = "loveMessage";
    wrap.id = "loveMessage";
    wrap.innerHTML = `
      <div class="loveCard" id="loveCard">
        <h1>For My Love 🤍🥚</h1>
        <p>
          Every kiss with you feels like my heart has found home.<br>
          You are my softness, my smile, my sweet forever.
        </p>
        <span class="loveSub">i love you more than words can hold 💋</span>
        <small class="tapBack"></small>
      </div>
    `;

    document.body.appendChild(wrap);

    const card = document.getElementById("loveCard");
    const overlay = document.getElementById("loveMessage");

    function goBackHome() {
      window.location.href = "../index.html";
    }

    if (card) {
      card.addEventListener("click", goBackHome);
    }

    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) {
          goBackHome();
        }
      });
    }
  }

  function spawnFloatingHearts(container) {
    const card = container.querySelector(".loveCard");
    if (!card) return;

    for (let i = 0; i < 14; i++) {
      setTimeout(function () {
        const heart = document.createElement("span");
        heart.className = "floating-heart";
        heart.innerHTML = Math.random() > 0.5 ? "❤" : "💖";
        heart.style.left = Math.random() * 90 + "%";
        heart.style.fontSize = 14 + Math.random() * 18 + "px";
        card.appendChild(heart);

        setTimeout(function () {
          heart.remove();
        }, 3500);
      }, i * 180);
    }
  }

  function showLoveMessage() {
    if (loveScreenShown) return;
    loveScreenShown = true;

    createLoveMessage();

    const loveMessage = document.getElementById("loveMessage");
    if (!loveMessage) return;

    loveMessage.classList.add("show");
    spawnFloatingHearts(loveMessage);
  }

  world.gravity.y = 0.25;

  let color = green;
  const width = shape[0].length * size;
  const height = shape.length * size;
  const startY = sceneHeight - shape.length * size - 20;
  let startX = 0;

  const boy = softSkeleton(
    startX,
    startY,
    shape,
    size,
    { stiffness: 0.99, render: { visible: false } },
    function (x, y, size, i, j) {
      const s = size * (j < 4 ? 0.8 : 1);
      const c =
        i === 2 && j === 9
          ? "#000"
          : j % 2 !== (i % 2 ? 0 : 1)
          ? color
          : "#52C292";

      return Bodies.rectangle(x, y, s, s, {
        render: {
          fillStyle: c,
          strokeStyle: color,
          lineWidth: s * 0.3
        }
      });
    }
  );

  World.add(world, boy);

  const shape2 = shape.map(function (row) {
    return row.slice().reverse();
  });

  color = pink;
  startX = Math.max(width * 2, sceneWidth - width / 2);

  const girl = softSkeleton(
    startX,
    startY,
    shape2,
    size,
    { stiffness: 0.9, render: { visible: false } },
    function (x, y, size, i, j) {
      const s = size * (j > 7 ? 0.8 : 1);
      const c =
        i === 2 && j === 2
          ? "#000"
          : j % 2 !== (i % 2 ? 0 : 1)
          ? color
          : "#CD4B72";

      return Bodies.rectangle(x, y, s, s, {
        render: {
          fillStyle: c,
          strokeStyle: color,
          lineWidth: s * 0.3
        }
      });
    }
  );

  World.add(world, girl);

  function onKeyDown(e) {
    const key = (e.code || e.key || "")
      .toLowerCase()
      .replace(/^(key|digit|numpad)/, "");

    let target;
    let invert = false;

    const girlTarget = girl.bodies[girl.bodies.length - 4];
    const boyTarget = boy.bodies[boy.bodies.length - 1];

    switch (key) {
      case "arrowright":
      case "arrowleft":
        target = girlTarget;
        break;
      case "1":
      case "2":
        target = boyTarget;
        break;
    }

    switch (key) {
      case "arrowleft":
      case "1":
        invert = true;
        break;
    }

    TweenMax.fromTo(
      '[data-key="' + key + '"]',
      0.1,
      { backgroundColor: "#eee" },
      {
        backgroundColor: "#ddd",
        repeat: 1,
        yoyo: true
      }
    );

    if (target && !loveScreenShown) {
      let force = speed * (invert ? -1 : 1);
      if (haveKissed) force *= 0.2;

      Body.applyForce(target, target.position, {
        x: force,
        y: 0
      });
    }
  }

  document.body.addEventListener("keydown", onKeyDown);

  function bindKeyButton(el) {
    const key = el.getAttribute("data-key");

    function triggerKey(e) {
      e.preventDefault();
      onKeyDown({ key: key });
    }

    el.addEventListener("mousedown", triggerKey);
    el.addEventListener("touchstart", triggerKey);
  }

  const keys = document.querySelectorAll("[data-key]");
  for (let i = 0; i < keys.length; i++) {
    bindKeyButton(keys[i]);
  }

  function kiss(x, y) {
    if (!haveKissed && !loveScreenShown) {
      haveKissed = true;
      showLoveMessage();

      const origGravity = world.gravity.y;

      TweenMax.to(world.gravity, 0.5, {
        y: -0.2,
        ease: Power3.easeIn
      });

      const s = size / 2;
      const heartWidth = s * heartShape[0].length;
      const heartHeight = heartShape.length * s;
      const c = "#DC3737";

      const heart = softSkeleton(
        x - heartWidth * 0.4,
        y - heartHeight * 1.75,
        heartShape,
        s,
        { stiffness: 0.7, render: { visible: false } },
        function (x, y) {
          return Bodies.rectangle(x, y, s, s, {
            frictionAir: 0.004,
            render: {
              fillStyle: c,
              strokeStyle: c
            }
          });
        }
      );

      World.add(world, heart);

      let bodiesLeft = heart.bodies.length;
      heart.bodies.forEach(function (bodyItem) {
        Events.on(bodyItem, "sleepStart", function () {
          Composite.remove(heart, bodyItem);
          bodiesLeft--;
          if (bodiesLeft <= 0) {
            World.remove(world, heart);
          }
        });
      });

      setTimeout(function () {
        const constraints = Composite.allConstraints(heart);
        constraints.forEach(function (constraint) {
          Composite.remove(heart, constraint);
        });

        TweenLite.to(world.gravity, 2, {
          y: origGravity,
          ease: Power3.easeIn
        });

        setTimeout(function () {
          Body.applyForce(girl.bodies[0], girl.bodies[0].position, {
            x: 0.12,
            y: 0
          });

          Body.applyForce(boy.bodies[0], boy.bodies[0].position, {
            x: -0.09,
            y: 0
          });
        }, 1200);
      }, 3500);
    }
  }

  const kissDetectors = [boy.bodies[4], girl.bodies[1]];

  Events.on(engine, "collisionStart", function (event) {
    const pairs = event.pairs;

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];

      if (
        kissDetectors.indexOf(pair.bodyA) > -1 &&
        kissDetectors.indexOf(pair.bodyB) > -1
      ) {
        const center = (pair.bodyA.position.x + pair.bodyB.position.x) / 2;
        kiss(center, boy.bodies[0].position.y - size * 2);
      }
    }
  });

  const render = Render.create({
    element: document.body,
    canvas: canvas,
    context: canvas.getContext("2d"),
    engine: engine,
    options: {
      hasBounds: true,
      width: sceneWidth,
      height: sceneHeight,
      wireframes: false
    }
  });

  Render.run(render);

  const mouse = mouseConstraint.mouse;
  let boundsScale = 1;
  let initial = true;

  function ease(current, target, easeAmount) {
    return current + (target - current) * (easeAmount || 0.2);
  }

  function resizeRender() {
    requestAnimationFrame(resizeRender);

    const distance =
      Math.abs(boy.bodies[0].position.x - girl.bodies[0].position.x) + width * 2;

    const boundsScaleTarget = distance / sceneWidth;

    boundsScale = ease(boundsScale, boundsScaleTarget, initial ? 1 : 0.01);

    render.bounds.min.x = ease(
      render.bounds.min.x,
      Math.min(boy.bodies[0].position.x - width, girl.bodies[0].position.x),
      initial ? 1 : 0.01
    );

    render.bounds.max.x = render.bounds.min.x + render.options.width * boundsScale;
    render.bounds.min.y = sceneHeight * -0.1 * boundsScale;
    render.bounds.max.y = sceneHeight * 0.9 * boundsScale;

    Mouse.setScale(mouse, { x: boundsScale, y: boundsScale });
    Mouse.setOffset(mouse, render.bounds.min);

    initial = false;
  }

  resizeRender();
  document.body.insertBefore(canvas, document.body.firstChild);
})();