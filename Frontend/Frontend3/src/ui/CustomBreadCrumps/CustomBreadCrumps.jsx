import React, { useEffect, useState } from "react";
import { Breadcrumbs, Link, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const CustomBreadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { product } = useSelector((state) => state.products);
  
  const [pathnames, setPathnames] = useState([]);

  // При монтировании загружаем пути из localStorage
  useEffect(() => {
    const savedPaths = JSON.parse(localStorage.getItem("paths")) || [];
    setPathnames(savedPaths);
  }, []);

  useEffect(() => {
    setPathnames((prevPathnames) => {
      let updatedPathnames = [...prevPathnames];

      if (pathname === "/") {
        updatedPathnames = [];
      } else {
        let lastSegment = pathname.split("/").filter(Boolean).pop();

        if (!isNaN(lastSegment) && product) {
          lastSegment = product.name;
        }

        const exists = updatedPathnames.some((item) => item.path === pathname);
        if (!exists) {
          updatedPathnames.push({ name: lastSegment, path: pathname });
        }
      }

      localStorage.setItem("paths", JSON.stringify(updatedPathnames));
      return updatedPathnames;
    });
  }, [pathname, product]);

  const handleBreadcrumbClick = (event, to) => {
    event.preventDefault();
    navigate(to);
  };

  const truncateText = (text, maxLength) =>
    text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

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
          <Typography color="textPrimary" key={value.path}>
            {truncateText(value.name || "", 10)}
          </Typography>
        ) : (
          <Link
            color="inherit"
            href={value.path}
            onClick={(event) => handleBreadcrumbClick(event, value.path)}
            key={value.path}
          >
            {truncateText(value.name || "", 20)}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

export default CustomBreadcrumbs;
