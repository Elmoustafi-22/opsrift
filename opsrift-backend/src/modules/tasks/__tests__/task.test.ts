import { createTask } from "../task.controller";
import Task from "../task.model";
import User from "../../users/user.model";
import { generateTaskBreakdown } from "../../../services/ai.service";
import { Request, Response, NextFunction } from "express";

jest.mock("../task.model");
jest.mock("../../users/user.model");
jest.mock("../../../services/ai.service");

describe("Task Controller - createTask", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    (generateTaskBreakdown as jest.Mock).mockResolvedValue("Mocked breakdown");
    jest.clearAllMocks();
  });

  it("should return 400 if required fields are missing", async () => {
    mockRequest.body = {
      title: "Test Task",
      // missing assignedTo and dueDate
    };

    await createTask(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Title, assignedTo, and dueDate are required",
    });
  });

  it("should return 400 if the assignee does not exist or is not a staff member", async () => {
    mockRequest.body = {
      title: "Test Task",
      assignedTo: "user123",
      dueDate: "2026-12-31T23:59:59Z",
    };

    // Mock User.findById to return null (user not found)
    (User.findById as jest.Mock).mockResolvedValue(null);

    await createTask(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(User.findById).toHaveBeenCalledWith("user123");
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Task must be assigned to a valid staff member",
    });
  });

  it("should successfully create a task when all parameters are valid", async () => {
    mockRequest.body = {
      title: "Test Task",
      description: "Sample Description",
      assignedTo: "staff123",
      dueDate: "2026-12-31T23:59:59Z",
    };
    mockRequest.user = {
      id: "admin123",
      role: "admin",
      email: "admin@opsrift.com",
      name: "Admin User",
    };

    const mockStaff = { _id: "staff123", role: "staff", name: "Staff Member" };
    const mockCreatedTask = {
      _id: "task999",
      title: "Test Task",
      description: "Sample Description",
      assignedTo: "staff123",
      createdBy: "admin123",
      dueDate: new Date("2026-12-31T23:59:59Z"),
      status: "pending",
    };

    (User.findById as jest.Mock).mockResolvedValue(mockStaff);
    (Task.create as jest.Mock).mockResolvedValue(mockCreatedTask);

    await createTask(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(User.findById).toHaveBeenCalledWith("staff123");
    expect(Task.create).toHaveBeenCalledWith({
      title: "Test Task",
      description: "Sample Description",
      aiBreakdown: "Mocked breakdown",
      assignedTo: "staff123",
      createdBy: "admin123",
      dueDate: new Date("2026-12-31T23:59:59Z"),
      status: "pending",
    });
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(mockCreatedTask);
  });
});
