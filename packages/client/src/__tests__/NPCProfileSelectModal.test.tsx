import type { NPCProfilePreview } from "@botc/shared";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as npcProfilesApi from "../api/npcProfilesApi";
import { NPCProfileSelectModal } from "../components/lobby/NPCProfileSelectModal";

// Mock the API module
vi.mock("../api/npcProfilesApi", () => ({
  fetchNPCProfilePreviews: vi.fn(),
}));

const mockFetchNPCProfilePreviews = vi.mocked(
  npcProfilesApi.fetchNPCProfilePreviews,
);

const mockProfiles: NPCProfilePreview[] = [
  {
    id: "starter-generic",
    name: "Starter NPC",
    description: "A balanced, generic NPC profile you can modify.",
    avatar: "🧩",
    difficulty: "beginner",
    tags: ["balanced", "starter", "generic"],
  },
  {
    id: "aggressive-hunter",
    name: "Aggressive Hunter",
    description: "Actively hunts for evil players with high confidence.",
    avatar: "🗡️",
    difficulty: "intermediate",
    tags: ["aggressive", "hunter", "confident"],
  },
];

describe("NPCProfileSelectModal", () => {
  const mockOnConfirm = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchNPCProfilePreviews.mockResolvedValue(mockProfiles);
  });

  it("does not render when closed", () => {
    render(
      <NPCProfileSelectModal
        open={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    expect(screen.queryByText("Select NPC Profile")).not.toBeInTheDocument();
  });

  it("renders modal when open and loads profiles", async () => {
    render(
      <NPCProfileSelectModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    expect(screen.getByText("Select NPC Profile")).toBeInTheDocument();
    expect(screen.getByText("Loading profiles...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Starter NPC")).toBeInTheDocument();
      expect(screen.getByText("Aggressive Hunter")).toBeInTheDocument();
    });

    expect(mockFetchNPCProfilePreviews).toHaveBeenCalledTimes(1);
  });

  it("defaults to starter-generic profile when available", async () => {
    render(
      <NPCProfileSelectModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Starter NPC")).toBeInTheDocument();
    });

    // Check that starter-generic is selected by default
    const starterRadio = screen.getByDisplayValue("starter-generic");
    expect(starterRadio).toBeChecked();
  });

  it("allows selecting a different profile", async () => {
    render(
      <NPCProfileSelectModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Aggressive Hunter")).toBeInTheDocument();
    });

    // Select the aggressive hunter profile
    const hunterRadio = screen.getByDisplayValue("aggressive-hunter");
    fireEvent.click(hunterRadio);

    expect(hunterRadio).toBeChecked();
    expect(screen.getByDisplayValue("starter-generic")).not.toBeChecked();
  });

  it("calls onConfirm with selected profile when confirmed", async () => {
    const mockOnConfirmAsync = vi.fn().mockResolvedValue(undefined);

    render(
      <NPCProfileSelectModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirmAsync}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Starter NPC")).toBeInTheDocument();
    });

    // Select aggressive hunter
    const hunterRadio = screen.getByDisplayValue("aggressive-hunter");
    fireEvent.click(hunterRadio);

    // Click confirm
    const addButton = screen.getByText("Add NPC");
    fireEvent.click(addButton);

    expect(mockOnConfirmAsync).toHaveBeenCalledWith("aggressive-hunter");
  });

  it("calls onClose when cancel button is clicked", async () => {
    render(
      <NPCProfileSelectModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Starter NPC")).toBeInTheDocument();
    });

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("calls onClose when X button is clicked", async () => {
    render(
      <NPCProfileSelectModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Starter NPC")).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText("Close");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("displays error message when API fails", async () => {
    mockFetchNPCProfilePreviews.mockRejectedValue(new Error("Network error"));

    render(
      <NPCProfileSelectModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    expect(screen.queryByText("Starter NPC")).not.toBeInTheDocument();
  });

  it("disables confirm button when no profile is selected", async () => {
    // Mock empty profiles to test no selection state
    mockFetchNPCProfilePreviews.mockResolvedValue([]);

    render(
      <NPCProfileSelectModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading profiles...")).not.toBeInTheDocument();
    });

    const addButton = screen.getByText("Add NPC");
    expect(addButton).toBeDisabled();
  });

  it("shows profile tags and difficulty", async () => {
    render(
      <NPCProfileSelectModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Starter NPC")).toBeInTheDocument();
    });

    // Check difficulty badges
    expect(screen.getByText("beginner")).toBeInTheDocument();
    expect(screen.getByText("intermediate")).toBeInTheDocument();

    // Check some tags are displayed
    expect(screen.getByText("balanced")).toBeInTheDocument();
    expect(screen.getByText("aggressive")).toBeInTheDocument();
  });
});
