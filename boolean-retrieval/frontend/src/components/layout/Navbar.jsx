import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Container,
  Box,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { GitHub, LinkedIn } from "@mui/icons-material"; 

const NavbarComponent = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Search", path: "/search" },
  ];

  return (
    <AppBar position="static" sx={{ backgroundColor: "#1F2937" }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="mobile-menu"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="mobile-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              {navLinks.map((link) => (
                <MenuItem
                  key={link.name}
                  component={Link}
                  to={link.path}
                  onClick={handleMenuClose}
                  selected={location.pathname === link.path}
                >
                  <Typography textAlign="center">{link.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {navLinks.map((link) => (
              <Button
                key={link.name}
                component={Link}
                to={link.path}
                sx={{
                  my: 2,
                  color: "white",
                  display: "block",
                  fontWeight: location.pathname === link.path ? "bold" : "normal",
                  "&:hover": {
                    color: "#60A5FA",
                  },
                }}
              >
                {link.name}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              component="a"
              href="https://github.com/sunnyallana/boolean-retrieval-model-pipeline"
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              sx={{ "&:hover": { color: "#60A5FA" } }}
            >
              <GitHub />
            </IconButton>
            <IconButton
              component="a"
              href="https://linkedin.com/in/sunnyallana/"
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              sx={{ "&:hover": { color: "#60A5FA" } }}
            >
              <LinkedIn />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default NavbarComponent;