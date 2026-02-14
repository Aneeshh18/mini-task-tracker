const redisMock = require("redis-mock");

jest.mock("../../dist/config/redis", () => ({
  getRedisClient: jest.fn(() => null)
}));

const { getRedisClient } = require("../../dist/config/redis");
const {
  cacheTasks,
  getCachedTasks,
  invalidateTasksCache
} = require("../../dist/services/cache.service");

const toPromiseClient = () => {
  const client = redisMock.createClient();

  return {
    get: (key) =>
      new Promise((resolve, reject) => {
        client.get(key, (error, value) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(value);
        });
      }),
    set: (key, value) =>
      new Promise((resolve, reject) => {
        client.set(key, value, (error, reply) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(reply);
        });
      }),
    del: (key) =>
      new Promise((resolve, reject) => {
        client.del(key, (error, count) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(count);
        });
      })
  };
};

describe("cache service", () => {
  test("caches, reads and invalidates tasks", async () => {
    const mockClient = toPromiseClient();
    getRedisClient.mockReturnValue(mockClient);

    await cacheTasks("user-1", [{ title: "Task A" }]);

    const cached = await getCachedTasks("user-1");
    expect(cached).toEqual([{ title: "Task A" }]);

    await invalidateTasksCache("user-1");

    const afterDelete = await getCachedTasks("user-1");
    expect(afterDelete).toBeNull();
  });

  test("returns null when redis client is unavailable", async () => {
    getRedisClient.mockReturnValue(null);

    const cached = await getCachedTasks("missing");
    expect(cached).toBeNull();
  });
});
