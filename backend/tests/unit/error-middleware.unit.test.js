const { ApiError, errorHandler } = require("../../dist/middleware/error.middleware");

describe("error middleware", () => {
  test("returns api error status and message", () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    errorHandler(new ApiError("Not found", 404), {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Not found" });
  });

  test("returns 500 for unknown error", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    errorHandler(new Error("boom"), {}, res, () => {});

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    consoleErrorSpy.mockRestore();
  });
});
