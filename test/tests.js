"use strict";
const assert = require("assert");
const whatwgEncoding = require("..");

describe("decode", () => {
  it("should decode BOM-less windows-1252", () => {
    const uint8Array = new Uint8Array([0x80, 0x95]);
    const string = whatwgEncoding.decode(uint8Array, "windows-1252");

    assert.strictEqual(string, "€•");
  });

  it("should override when it sees a UTF-8 BOM", () => {
    const uint8Array = new Uint8Array([0xEF, 0xBB, 0xBF, 0xE2, 0x82, 0xAC, 0xE2, 0x80, 0xA2]);
    const string = whatwgEncoding.decode(uint8Array, "windows-1252");

    assert.strictEqual(string, "€•");
  });

  it("should override when it sees a UTF-16LE BOM", () => {
    const uint8Array = new Uint8Array([0xFF, 0xFE, 0xAC, 0x20, 0x22, 0x20]);
    const string = whatwgEncoding.decode(uint8Array, "windows-1252");

    assert.strictEqual(string, "€•");
  });

  it("should override when it sees a UTF-16BE BOM", () => {
    const uint8Array = new Uint8Array([0xFE, 0xFF, 0x20, 0xAC, 0x20, 0x22]);
    const string = whatwgEncoding.decode(uint8Array, "windows-1252");

    assert.strictEqual(string, "€•");
  });

  it("should throw a TypeError on invalid byte sequence inputs for a given encoding when mode is fatal", () => {
    // Anything fails for replacement
    assert.throws(() => whatwgEncoding.decode(new Uint8Array([0x20]), "replacement", { errorMode: "fatal" }), TypeError);

    assert.throws(() => whatwgEncoding.decode(new Uint8Array([0x83, 0x5C]), "Big5", { errorMode: "fatal" }), TypeError);
  });

  it("should output U+FFFD for a given encoding when mode is replacement (the default)", () => {
    // Anything fails for replacement
    assert.strictEqual(whatwgEncoding.decode(new Uint8Array([0x20]), "replacement", { errorMode: "replacement" }), "\uFFFD");
    assert.strictEqual(whatwgEncoding.decode(new Uint8Array([0x20]), "replacement"), "\uFFFD");

    assert.strictEqual(whatwgEncoding.decode(new Uint8Array([0x83, 0x5C]), "Big5", { errorMode: "replacement" }), "\uFFFD");
    assert.strictEqual(whatwgEncoding.decode(new Uint8Array([0x83, 0x5C]), "Big5"), "\uFFFD\u005C");
  });

  it("should return the empty string for empty input", () => {
    assert.strictEqual(whatwgEncoding.decode(new Uint8Array([]), "replacement"), "");
    assert.strictEqual(whatwgEncoding.decode(new Uint8Array([]), "Big5"), "");
  });

  it("should throw when given an invalid encoding name", () => {
    assert.throws(() => whatwgEncoding.decode(new Uint8Array([]), "asdf"), RangeError);
    assert.throws(() => whatwgEncoding.decode(new Uint8Array([]), "utf-8"), RangeError);
    assert.throws(() => whatwgEncoding.decode(new Uint8Array([]), " UTF-8"), RangeError);
    assert.throws(() => whatwgEncoding.decode(new Uint8Array([]), "UTF-32"), RangeError);
  });

  it("should throw when given an encoding label that is not a name", () => {
    assert.throws(() => whatwgEncoding.decode(new Uint8Array([]), "ascii"), RangeError);
    assert.throws(() => whatwgEncoding.decode(new Uint8Array([]), "latin1"), RangeError);
    assert.throws(() => whatwgEncoding.decode(new Uint8Array([]), "iso88591"), RangeError);
  });
});

describe("labelToName", () => {
  it("should return names for labels", () => {
    assert.strictEqual(whatwgEncoding.labelToName("ascii"), "windows-1252");
    assert.strictEqual(whatwgEncoding.labelToName("csibm866"), "IBM866");
    assert.strictEqual(whatwgEncoding.labelToName("latin3"), "ISO-8859-3");
    assert.strictEqual(whatwgEncoding.labelToName("tis-620"), "windows-874");
    assert.strictEqual(whatwgEncoding.labelToName("replacement"), "replacement");
  });

  it("should be case-insensitive", () => {
    assert.strictEqual(whatwgEncoding.labelToName("ASCII"), "windows-1252");
    assert.strictEqual(whatwgEncoding.labelToName("csIBM866"), "IBM866");
    assert.strictEqual(whatwgEncoding.labelToName("laTIn3"), "ISO-8859-3");
    assert.strictEqual(whatwgEncoding.labelToName("Tis-620"), "windows-874");
  });

  it("should trim ASCII whitespace", () => {
    assert.strictEqual(whatwgEncoding.labelToName("\u0009ascii\u000A"), "windows-1252");
    assert.strictEqual(whatwgEncoding.labelToName("\u000C\u000Ccsibm866"), "IBM866");
    assert.strictEqual(whatwgEncoding.labelToName("latin3\u000D\u000D"), "ISO-8859-3");
    assert.strictEqual(whatwgEncoding.labelToName("tis-620\u0020"), "windows-874");
  });

  it("should trim ASCII whitespace and be case-insensitive", () => {
    assert.strictEqual(whatwgEncoding.labelToName("\u0009ASCII\u000A"), "windows-1252");
    assert.strictEqual(whatwgEncoding.labelToName("\u000C\u000CcsIBM866"), "IBM866");
    assert.strictEqual(whatwgEncoding.labelToName("laTIn3\u000D\u000D"), "ISO-8859-3");
    assert.strictEqual(whatwgEncoding.labelToName("Tis-620\u0020"), "windows-874");
  });

  it("should return null for invalid encoding labels", () => {
    assert.strictEqual(whatwgEncoding.labelToName("AS\u0009CII"), null);
    assert.strictEqual(whatwgEncoding.labelToName("asdf"), null);
    assert.strictEqual(whatwgEncoding.labelToName("UTF-32"), null);
  });

  it("should return null for non-strings", () => {
    assert.strictEqual(whatwgEncoding.labelToName(), null);
    assert.strictEqual(whatwgEncoding.labelToName(5), null);
    assert.strictEqual(whatwgEncoding.labelToName({}), null);
  });
});

describe("isSupported", () => {
  it("should return true for all supported encodings", () => {
    assert.strictEqual(whatwgEncoding.isSupported("UTF-8"), true);
    assert.strictEqual(whatwgEncoding.isSupported("IBM866"), true);
    assert.strictEqual(whatwgEncoding.isSupported("ISO-8859-2"), true);
    assert.strictEqual(whatwgEncoding.isSupported("ISO-8859-3"), true);
    assert.strictEqual(whatwgEncoding.isSupported("ISO-8859-4"), true);
    assert.strictEqual(whatwgEncoding.isSupported("ISO-8859-5"), true);
    assert.strictEqual(whatwgEncoding.isSupported("ISO-8859-6"), true);
    assert.strictEqual(whatwgEncoding.isSupported("ISO-8859-7"), true);
    assert.strictEqual(whatwgEncoding.isSupported("ISO-8859-8"), true);
    assert.strictEqual(whatwgEncoding.isSupported("ISO-8859-10"), true);
    assert.strictEqual(whatwgEncoding.isSupported("ISO-8859-13"), true);
    assert.strictEqual(whatwgEncoding.isSupported("ISO-8859-14"), true);
    assert.strictEqual(whatwgEncoding.isSupported("ISO-8859-15"), true);
    assert.strictEqual(whatwgEncoding.isSupported("ISO-8859-16"), true);
    assert.strictEqual(whatwgEncoding.isSupported("KOI8-R"), true);
    assert.strictEqual(whatwgEncoding.isSupported("KOI8-U"), true);
    assert.strictEqual(whatwgEncoding.isSupported("macintosh"), true);
    assert.strictEqual(whatwgEncoding.isSupported("windows-874"), true);
    assert.strictEqual(whatwgEncoding.isSupported("windows-1250"), true);
    assert.strictEqual(whatwgEncoding.isSupported("windows-1251"), true);
    assert.strictEqual(whatwgEncoding.isSupported("windows-1252"), true);
    assert.strictEqual(whatwgEncoding.isSupported("windows-1253"), true);
    assert.strictEqual(whatwgEncoding.isSupported("windows-1254"), true);
    assert.strictEqual(whatwgEncoding.isSupported("windows-1255"), true);
    assert.strictEqual(whatwgEncoding.isSupported("windows-1256"), true);
    assert.strictEqual(whatwgEncoding.isSupported("windows-1257"), true);
    assert.strictEqual(whatwgEncoding.isSupported("windows-1258"), true);
    assert.strictEqual(whatwgEncoding.isSupported("GBK"), true);
    assert.strictEqual(whatwgEncoding.isSupported("gb18030"), true);
    assert.strictEqual(whatwgEncoding.isSupported("Big5"), true);
    assert.strictEqual(whatwgEncoding.isSupported("EUC-JP"), true);
    assert.strictEqual(whatwgEncoding.isSupported("Shift_JIS"), true);
    assert.strictEqual(whatwgEncoding.isSupported("EUC-KR"), true);
    assert.strictEqual(whatwgEncoding.isSupported("UTF-16BE"), true);
    assert.strictEqual(whatwgEncoding.isSupported("UTF-16LE"), true);
    assert.strictEqual(whatwgEncoding.isSupported("ISO-2022-JP"), true);
    assert.strictEqual(whatwgEncoding.isSupported("ISO-8859-8-I"), true);
    assert.strictEqual(whatwgEncoding.isSupported("replacement"), true);
    assert.strictEqual(whatwgEncoding.isSupported("x-mac-cyrillic"), true);
    assert.strictEqual(whatwgEncoding.isSupported("x-user-defined"), true);
    assert.strictEqual(whatwgEncoding.isSupported("replacement"), true);
  });

  it("should return false for miscapitalizations and non-name labels", () => {
    assert.strictEqual(whatwgEncoding.isSupported("utf-8"), false);
    assert.strictEqual(whatwgEncoding.isSupported(" UTF-8"), false);
    assert.strictEqual(whatwgEncoding.isSupported("latin1"), false);
  });

  it("should return false for invalid encoding names", () => {
    assert.strictEqual(whatwgEncoding.isSupported("asdf"), false);
    assert.strictEqual(whatwgEncoding.isSupported("UTF-32"), false);
  });
});

describe("getBOMEncoding", () => {
  it("should return UTF-8 for a UTF-8 BOM", () => {
    const uint8Array = new Uint8Array([0xEF, 0xBB, 0xBF, 0xE2, 0x82, 0xAC, 0xE2, 0x80, 0xA2]);
    const encoding = whatwgEncoding.getBOMEncoding(uint8Array);

    assert.strictEqual(encoding, "UTF-8");
  });

  it("should return UTF-16LE for a UTF-16LE BOM", () => {
    const uint8Array = new Uint8Array([0xFF, 0xFE, 0xAC, 0x20, 0x22, 0x20]);
    const encoding = whatwgEncoding.getBOMEncoding(uint8Array);

    assert.strictEqual(encoding, "UTF-16LE");
  });

  it("should return UTF-16BE for a UTF-16BE BOM", () => {
    const uint8Array = new Uint8Array([0xFE, 0xFF, 0x20, 0xAC, 0x20, 0x22]);
    const encoding = whatwgEncoding.getBOMEncoding(uint8Array);

    assert.strictEqual(encoding, "UTF-16BE");
  });

  it("should return null for no BOM", () => {
    const uint8Array = new Uint8Array([0x80, 0x95]);
    const encoding = whatwgEncoding.getBOMEncoding(uint8Array);

    assert.strictEqual(encoding, null);
  });

  it("should return UTF-16LE for a UTF-32LE BOM", () => {
    const uint8Array = new Uint8Array([0xFF, 0xFE, 0x00, 0x00]);
    const encoding = whatwgEncoding.getBOMEncoding(uint8Array);

    assert.strictEqual(encoding, "UTF-16LE");
  });

  it("should return null for a UTF-32BE BOM", () => {
    const uint8Array = new Uint8Array([0x00, 0x00, 0xFF, 0xFE]);
    const encoding = whatwgEncoding.getBOMEncoding(uint8Array);

    assert.strictEqual(encoding, null);
  });

  it("should return null for an empty uint8Array", () => {
    const uint8Array = new Uint8Array([]);
    const encoding = whatwgEncoding.getBOMEncoding(uint8Array);

    assert.strictEqual(encoding, null);
  });

  it("should return null for a one-byte uint8Array", () => {
    const uint8Array = new Uint8Array([0xFF]);
    const encoding = whatwgEncoding.getBOMEncoding(uint8Array);

    assert.strictEqual(encoding, null);
  });
});
