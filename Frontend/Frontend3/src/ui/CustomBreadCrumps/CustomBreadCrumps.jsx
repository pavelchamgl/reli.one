import React, { useEffect, useState } from 'react';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const CustomBreadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = location.pathname;

  const [pathnames, setPathnames] = useState(() => {
    const savedPaths = JSON.parse(localStorage.getItem("paths"));
    return savedPaths ? savedPaths : [];
  });

  useEffect(() => {
    let updatedPathnames = JSON.parse(localStorage.getItem("paths")) || [];

    if (pathname === "/") {
      // Если находимся на главной странице, сбрасываем пути
      updatedPathnames = [];
    } else if (!updatedPathnames.includes(pathname)) {
      // Добавляем новый путь, если его еще нет в массиве
      updatedPathnames.push(pathname);
    }

    // Сохраняем обновленный массив в localStorage
    localStorage.setItem("paths", JSON.stringify(updatedPathnames));
    setPathnames(updatedPathnames);
  }, [pathname]);

  const handleBreadcrumbClick = (event, to) => {
    event.preventDefault();
    navigate(to);
  };

  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Link
        color="inherit"
        href="/"
        onClick={(event) => handleBreadcrumbClick(event, "/")}
      >
        Home
      </Link>
      {pathnames.map((value, index) => {
        const isLast = index === pathnames.length - 1;
        return isLast ? (
          <Typography color="textPrimary" key={value}>
            {value.split('/').filter(Boolean).pop()}
          </Typography>
        ) : (
          <Link
            color="inherit"
            href={value}
            onClick={(event) => handleBreadcrumbClick(event, value)}
            key={value}
          >
            {value.split('/').filter(Boolean).pop()}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

export default CustomBreadcrumbs;
