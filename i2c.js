// @ts-nocheck
const { BufferedGraphicsContext } = require("graphics");

/**
 * SH1107 class
 */
class SH1107 {
  /**
   * Setup SH1107
   * @param {I2C} i2c
   * @param {Object} options
   *   .width {number=128}
   *   .height {number=64}
   *   .rst {number=-1}
   *   .address {number=0x3C}
   *   .extVcc {boolean=false}
   *   .rotation {number=0}
   */
  setup(i2c, options) {
    this.i2c = i2c;
    options = Object.assign(
      {
        width: 128,
        height: 64,
        rst: -1,
        address: 0x3C, // 0x3C for 32px height, 0x3D for others
        extVcc: false,
        rotation: 0,
      },
      options
    );
    this.width = options.width;
    this.height = options.height;
    this.rst = options.rst;
    this.address = options.address;
    this.extVcc = options.extVcc;
    this.rotation = options.rotation;
    this.context = null;
    if (this.rst > -1) pinMode(this.rst, OUTPUT);
    this.reset();
    var initCmds = new Uint8Array([
      0xAE, 0x00,  // display off, sleep mode
      0xDC, 0x01, 0x00,  // set display start line 0
      0x81, 0x01, 0x4F,  // contrast setting = 0x4f
      0x20, 0x00,  // vertical (column) addressing mode (POR=0x20)
      0xA0, 0x00,  // segment remap = 1 (POR=0, down rotation)
      0xC0, 0x00,  // common output scan direction = 0 (0 to n-1 (POR=0))
      0xA8, 0x01, 0x7F,  // multiplex ratio = 128 (POR=0x7F)
      0xD3, 0x01, 0x60,  // set display offset mode = 0x60
      0xD5, 0x01, 0x51,  // divide ratio/oscillator: divide by 2, fOsc (POR)
      0xD9, 0x01, 0x22,  // pre-charge/dis-charge period mode: 2 DCLKs/2 DCLKs (POR)
      0xDB, 0x01, 0x35,  // VCOM deselect level = 0.770 (POR)
      0xB0, 0x00,  // set page address = 0 (POR)
      0xA4, 0x00,  // entire display off, retain RAM, normal status (POR)
      0xA6, 0x00,  // normal (not reversed) display
      0xAF, 0x00   // DISPLAY_ON
    ]);
    this.sendCommands(initCmds);
    delay(200);
  }

  sendCommands(cmds) {
    cmds.forEach((c) => {
      this.i2c.write(new Uint8Array([0, c]), this.address);
    });
  }

  /**
   * Reset
   */
  reset() {
    if (this.rst > -1) {
      pinMode(this.rst, OUTPUT);
      digitalWrite(this.rst, HIGH);
      delay(1);
      digitalWrite(this.rst, LOW);
      delay(10);
      digitalWrite(this.rst, HIGH);
    }
  }

  /**
   * Return a graphic context
   * @return {GraphicsContext}
   */
  getContext() {
    if (!this.context) {
      this.context = new BufferedGraphicsContext(this.width, this.height, {
        rotation: this.rotation,
        bpp: 1,
        display: (buffer) => {
          // lower column command = 0x00 - 0x0F
          // upper column command = 0x10 - 0x17
          // set page address = 0xB0 - 0xBF(16 pages)
          var cmds = new Uint8Array([
            0xB0, // pages
            0,
            (this.height >> 3) - 1,
            0x00, // columns
            0,
            this.width - 1,
          ]);
          this.sendCommands(cmds);
          var WIRE_MAX = 128;
          var chunk = new Uint8Array(WIRE_MAX + 1);
          chunk[0] = 0x40;
          for (var i = 0; i < buffer.byteLength; i += WIRE_MAX) {
            chunk.set(new Uint8Array(buffer.buffer, i, WIRE_MAX), 1);
            this.i2c.write(chunk, this.address);
          }
        },
      });
    }
    return this.context;
  }

  /**
   * Turn on
   */
  on() {
    this.i2c.write(new Uint8Array([0, 0xAF]), this.address);
  }

  /**
   * Turn off
   */
  off() {
    this.i2c.write(new Uint8Array([0, 0xAE]), this.address);
  }

  /**
   * Set contrast
   */
  setContrast(c) {
    this.i2c.write(new Uint8Array([0, 0x81, c]), this.address);
  }
}

exports.SH1107 = SH1107;
