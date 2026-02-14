const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

jest.mock("../../dist/config/redis", () => ({
  getRedisClient: jest.fn(() => null)
}));

const { getRedisClient } = require("../../dist/config/redis");
const app = require("../../dist/app").default;
const { UserModel } = require("../../dist/models/user.model");
const { TaskModel } = require("../../dist/models/task.model");

let mongoServer;
let redisClient;

const createUserAndToken = async (email = "demo@example.com") => {
  const res = await request(app).post("/api/auth/signup").send({
    name: "Demo User",
    email,
    password: "password123"
  });

  return {
    token: res.body.token,
    userId: res.body.user.id
  };
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(() => {
  redisClient = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1)
  };

  getRedisClient.mockReturnValue(redisClient);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("API integration", () => {
  test("signs up and logs in a user", async () => {
    const signupRes = await request(app).post("/api/auth/signup").send({
      name: "Anees",
      email: "anees@example.com",
      password: "password123"
    });

    expect(signupRes.status).toBe(201);
    expect(signupRes.body.token).toBeDefined();
    expect(signupRes.body.user.email).toBe("anees@example.com");

    const userInDb = await UserModel.findOne({ email: "anees@example.com" });
    expect(userInDb.password).not.toBe("password123");

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "anees@example.com",
      password: "password123"
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });

  test("rejects invalid credentials", async () => {
    await createUserAndToken("wrongpass@example.com");

    const res = await request(app).post("/api/auth/login").send({
      email: "wrongpass@example.com",
      password: "bad-password"
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  test("requires auth for task routes", async () => {
    const res = await request(app).get("/api/tasks");

    expect(res.status).toBe(401);
  });

  test("creates, lists, updates and deletes tasks", async () => {
    const { token } = await createUserAndToken("tasks@example.com");

    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Finish assignment",
        description: "Implement full stack tracker"
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.task.title).toBe("Finish assignment");
    expect(redisClient.del).toHaveBeenCalledTimes(1);

    const listRes = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.tasks).toHaveLength(1);
    expect(redisClient.get).toHaveBeenCalledTimes(1);
    expect(redisClient.set).toHaveBeenCalledTimes(1);

    const taskId = listRes.body.tasks[0]._id;

    const updateRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "completed" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.task.status).toBe("completed");
    expect(redisClient.del).toHaveBeenCalledTimes(2);

    const deleteRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toMatch(/deleted/i);
    expect(redisClient.del).toHaveBeenCalledTimes(3);

    const totalTasks = await TaskModel.countDocuments();
    expect(totalTasks).toBe(0);
  });

  test("serves cached tasks when present", async () => {
    const { token } = await createUserAndToken("cache@example.com");

    redisClient.get.mockResolvedValueOnce(
      JSON.stringify([
        {
          _id: "abc123",
          title: "Cached task",
          status: "pending"
        }
      ])
    );

    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.tasks[0].title).toBe("Cached task");
    expect(redisClient.set).not.toHaveBeenCalled();
  });

  test("restricts task ownership and validates task id", async () => {
    const { token: userOneToken } = await createUserAndToken("owner1@example.com");
    const { token: userTwoToken } = await createUserAndToken("owner2@example.com");

    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${userOneToken}`)
      .send({ title: "Private task" });

    const taskId = createRes.body.task._id;

    const forbiddenUpdate = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${userTwoToken}`)
      .send({ title: "New title" });

    expect(forbiddenUpdate.status).toBe(404);

    const invalidIdDelete = await request(app)
      .delete("/api/tasks/not-an-id")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(invalidIdDelete.status).toBe(400);
  });
});
