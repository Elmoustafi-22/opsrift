import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, type Mock } from "vitest";
import NotificationDropdown from "../NotificationDropdown";
import { useNotificationStore } from "../../store/useNotificationStore";
import { MemoryRouter } from "react-router-dom";

// Mock the store hook
vi.mock("../../store/useNotificationStore");

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("NotificationDropdown", () => {
  it("renders notifications and handles navigation", () => {
    const mockNotifications = [
      {
        _id: "1",
        title: "Test Message",
        body: "Hello world",
        type: "MESSAGE",
        read: false,
        referenceId: "task123",
        createdAt: new Date().toISOString(),
      },
    ];

    // Mock store implementation
    (useNotificationStore as unknown as Mock).mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 1,
      isOpen: true,
      closeDropdown: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
    });

    render(
      <MemoryRouter>
        <NotificationDropdown />
      </MemoryRouter>
    );

    expect(screen.getByText("Test Message")).toBeInTheDocument();

    // Test click navigation
    fireEvent.click(screen.getByText("Test Message"));
    expect(mockNavigate).toHaveBeenCalledWith("/tasks/task123");
  });

  it("renders empty state", () => {
    (useNotificationStore as unknown as Mock).mockReturnValue({
      notifications: [],
      unreadCount: 0,
      isOpen: true,
      closeDropdown: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
    });

    render(
      <MemoryRouter>
        <NotificationDropdown />
      </MemoryRouter>
    );

    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
  });
});
