/* eslint-disable no-console */
import React, { memo, useCallback, useState, useEffect } from "react";
import Button from "@jetbrains/ring-ui-built/components/button/button";

// Register widget in YouTrack
const host = await YTApp.register();

interface Project {
  id: string;
  name: string;
  isActive: boolean;
}

const AppComponent: React.FunctionComponent = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch projects and their isActive status
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);

      // Get all projects
      const projectsResult: any = await host.fetchYouTrack("admin/projects", {
        query: {
          fields: "id,name"
        }
      });

      // Get isActive status for each project using the workflow command
      const updatedProjects = await Promise.all(projectsResult.map(async (project: any) => {
        try {
          // Execute the workflow command to get isActive
          const response: any = await host.fetchYouTrack("api/commands", {
            method: "POST",
            body: {
              command: "getIsActive",
              arguments: [],
              query: {
                issues: [],
                projects: [project.id]
              }
            }
          });

          // Extract isActive from response
          const isActive = response?.result?.isActive || false;

          return {
            ...project,
            isActive
          };
        } catch (error) {
          console.error(`Failed to get isActive for project ${project.id}`, error);
          return {
            ...project,
            isActive: false
          };
        }
      }));

      setProjects(updatedProjects);
    } catch (error) {
      console.error("Error fetching projects", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle isActive status
  const toggleIsActive = useCallback(async (projectId: string) => {
    try {
      setLoading(true);

      // Execute the workflow command to toggle isActive
      await host.fetchYouTrack("api/commands", {
        method: "POST",
        body: {
          command: "toggleIsActive",
          arguments: [],
          query: {
            issues: [],
            projects: [projectId]
          }
        }
      });

      // Update local state
      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? { ...p, isActive: !p.isActive }
            : p
        )
      );
    } catch (error) {
      console.error(`Error toggling isActive for project ${projectId}`, error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="widget">
      <h2>Project Extension Properties</h2>
      <Button disabled={loading} onClick={fetchProjects}>
        {loading ? "Loading..." : "Refresh Projects"}
      </Button>

      {projects.length > 0 && (
        <table style={{ width: "100%", marginTop: "20px", borderCollapse: "collapse" }}>
          <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Project ID</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Project Name</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Is Active</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd" }}>Actions</th>
          </tr>
          </thead>
          <tbody>
          {projects.map(project => (
            <tr key={project.id}>
              <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{project.id}</td>
              <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{project.name}</td>
              <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>{project.isActive ? "Yes" : "No"}</td>
              <td style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>
                <Button disabled={loading} onClick={() => toggleIsActive(project.id)}>
                  {project.isActive ? "Deactivate" : "Activate"}
                </Button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export const App = memo(AppComponent);