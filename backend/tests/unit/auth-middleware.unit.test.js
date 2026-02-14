const { authMiddleware } = require("../../dist/middleware/auth.middleware");
const { signToken } = require("../../dist/utils/jwt");
const { ApiError } = require("../../dist/middleware/error.middleware");

describe("auth middleware", () => {
  test("throws unauthorized when auth header is missing", () => {
    const req = { headers: {} };

    expect(() => authMiddleware(req, {}, () => {})).toThrow(ApiError);
  });

  test("attaches user id for valid token", () => {
    const token = signToken("user-999");
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();

    authMiddleware(req, {}, next);

    expect(req.user.id).toBe("user-999");
    expect(next).toHaveBeenCalledTimes(1);
  });
});
