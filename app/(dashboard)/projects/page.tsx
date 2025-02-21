import React, { useState } from 'react';

interface Project {
  id: string;
  [key: string]: any;
}

const [projects, setProjects] = useState<Project[]>([]);

const handleProjectSubmit = (projectData: any) => {
  if (projectData._action === 'update') {
    // 기존 프로젝트 목록에서 수정된 프로젝트를 찾아 업데이트
    setProjects(prevProjects => 
      prevProjects.map((project: Project) => 
        project.id === projectData.id ? projectData : project
      )
    );
  } else {
    // 새 프로젝트 추가
    setProjects(prevProjects => [...prevProjects, projectData]);
  }
}; 