"use strict";

const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0, 1);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_particles[200]; // max 200 particles
uniform int u_numParticles;

in vec2 v_uv;
out vec4 outColor;

void main() {
  vec2 fragCoord = v_uv * u_resolution;
  float intensity = 0.0;
  float sigma = 10.0; // standard deviation in pixels

  for (int i = 0; i < 200; ++i) {
    if (i >= u_numParticles) {
      break;
    }
    vec2 particlePos = u_particles[i];
    float dist = length(fragCoord - particlePos);
    intensity += exp(- (dist * dist) / (2.0 * sigma * sigma));
  }

  intensity = clamp(intensity, 0.0, 1.0);
  outColor = vec4(vec3(intensity), 1.0);
}
`;

function main() {
  const canvas = document.getElementById("webglCanvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL2 not supported");
    return;
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const u_resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const u_particlesLocation = gl.getUniformLocation(program, "u_particles");
  const u_numParticlesLocation = gl.getUniformLocation(program, "u_numParticles");

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Fullscreen triangle
  const fullscreenTriangle = new Float32Array([
    -1, -1,
     3, -1,
    -1,  3,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, fullscreenTriangle, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.useProgram(program);
  gl.bindVertexArray(vao);
  gl.uniform2f(u_resolutionLocation, gl.canvas.width, gl.canvas.height);

  const numParticles = 100000; // how many particles
  const particleData = new Float32Array(2 * numParticles);
  let particleVelocities = new Float32Array(2 * numParticles);

  for (let i = 0; i < numParticles; ++i) {
    particleData[i * 2 + 0] = Math.random() * gl.canvas.width;
    particleData[i * 2 + 1] = Math.random() * gl.canvas.height;

    particleVelocities[i * 2 + 0] = getRandomArbitrary(-10, 10);
    particleVelocities[i * 2 + 1] = getRandomArbitrary(-10, 10);
  }

//   gl.uniform2fv(u_particlesLocation, particleData);
  gl.uniform1i(u_numParticlesLocation, numParticles);

//   gl.clearColor(0, 0, 0, 1);
//   gl.clear(gl.COLOR_BUFFER_BIT);

//   gl.drawArrays(gl.TRIANGLES, 0, 3);


  function update() {
    // Update particle positions based on velocity
    for (let i = 0; i < numParticles; ++i) {
      particleData[i * 2 + 0] += particleVelocities[i * 2 + 0];  // Update x position
      particleData[i * 2 + 1] += particleVelocities[i * 2 + 1];  // Update y position
    }

    gl.uniform2fv(u_particlesLocation, particleData);  // Update particle positions in shader

    // Clear and draw particles again
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    requestAnimationFrame(update);
  }

  update();
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function resizeCanvasToDisplaySize(canvas) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

main();
