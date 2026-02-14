const { signToken, verifyToken } = require("../../dist/utils/jwt");

describe("jwt utils", () => {
  test("signs and verifies token", () => {
    const token = signToken("user-123");
    const payload = verifyToken(token);

    expect(payload.userId).toBe("user-123");
  });

  test("throws on invalid token", () => {
    expect(() => verifyToken("invalid.token.value")).toThrow();
  });
});
