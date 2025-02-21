const handleProjectSubmit = (projectData: any) => {
  if (projectData._action === 'update') {
    // 기존 프로젝트 목록에서 수정된 프로젝트를 찾아 업데이트
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === projectData.id ? projectData : project
      )
    );
  } else {
    // 새 프로젝트 추가
    setProjects(prevProjects => [...prevProjects, projectData]);
  }
}; 