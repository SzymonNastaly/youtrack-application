/* eslint-disable no-console */
import React, { memo, useEffect, useState } from "react";
import Toggle from "@jetbrains/ring-ui-built/components/toggle/toggle";
import Loader from "@jetbrains/ring-ui-built/components/loader/loader";
import Island from "@jetbrains/ring-ui-built/components/island/island";

const host = await YTApp.register();

interface Project {
  id: string;
  name: string;
}

interface ProjectActiveMap {
  [projectId: string]: boolean;
}

interface PropertyResult {
  projectActiveObject?: string;
}

const AppComponent: React.FunctionComponent = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeMap, setActiveMap] = useState<ProjectActiveMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const updateStorage = async (updatedMap: ProjectActiveMap) => {
    try {
      const result = await host.fetchApp("backend-global/setProjectProperty", {
        method: "POST",
        body: {
          projectActiveObject: JSON.stringify(updatedMap)
        }
      });

      if (result) {
        setActiveMap(updatedMap);
      } else {
        setError("Failed to update project configuration");
      }
    } catch (updateError) {
      console.error("Error updating project property:", updateError);
      setError(`Update failed: ${String(updateError)}`);
    }
  };

  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);

        const projectsResult: Project[] = await host.fetchYouTrack("admin/projects", {
          query: {
            fields: "id,name"
          }
        });

        console.log("Fetched projects:", projectsResult);

        const propertyResult: PropertyResult = await host.fetchApp("backend-global/getProjectProperty", {});
        console.log("Property result:", propertyResult);

        // Parse the active map from the extension property, or initialize empty object
        let currentActiveMap: ProjectActiveMap = {};
        if (propertyResult && propertyResult.projectActiveObject) {
          try {
            currentActiveMap = JSON.parse(propertyResult.projectActiveObject);
            console.log("Parsed active map:", currentActiveMap);
          } catch (e) {
            console.error("Error parsing projectActiveObject:", e);
            // Initialize empty object if parsing fails
          }
        }

        // Initialize any missing projects in the active map
        const updatedActiveMap = { ...currentActiveMap };
        let needsUpdate = false;

        projectsResult.forEach((project: Project) => {
          if (updatedActiveMap[project.id] === undefined) {
            updatedActiveMap[project.id] = false; // Default to inactive
            needsUpdate = true;
          }
        });

        // If we added any missing projects, update the storage
        if (needsUpdate) {
          await updateStorage(updatedActiveMap);
        }

        setProjects(projectsResult);
        setActiveMap(updatedActiveMap);
      } catch (initError) {
        console.error("Error initializing:", initError);
        setError(`Failed to initialize: ${String(initError)}`);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  const handleToggleChange = async (projectId: string, newValue: boolean) => {
    console.log(`Toggling project ${projectId} to ${newValue}`);
    const updatedMap = {
      ...activeMap,
      [projectId]: newValue
    };

    await updateStorage(updatedMap);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h3>Project Activity Status</h3>

      {error && (
        <div style={{ color: "red", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      <Island>
        {projects.map((project) => (
          <div
            key={project.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: "1px solid #e5e5e5"
            }}
          >
            <span>{project.name}</span>
            <Toggle
              checked={activeMap[project.id] || false}
              onChange={() => handleToggleChange(project.id, !activeMap[project.id])}
            />
          </div>
        ))}
      </Island>
    </div>
  );
};

export const App = memo(AppComponent);
