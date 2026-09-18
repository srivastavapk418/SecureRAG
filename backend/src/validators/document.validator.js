function validateDocumentMetadata(body) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  const allowedAccessLevels = ["public", "department", "admin_only"];
  const rawAccessLevel = typeof body.accessLevel === "string" ? body.accessLevel.trim() : "public";
  const accessLevel = allowedAccessLevels.includes(rawAccessLevel) ? rawAccessLevel : "public";

  let allowedDepartments = [];
  if (Array.isArray(body.allowedDepartments)) {
    allowedDepartments = body.allowedDepartments.map((d) => String(d).trim()).filter(Boolean);
  } else if (typeof body.allowedDepartments === "string" && body.allowedDepartments.trim()) {
    try {
      const parsed = JSON.parse(body.allowedDepartments);
      if (Array.isArray(parsed)) {
        allowedDepartments = parsed.map((d) => String(d).trim()).filter(Boolean);
      }
    } catch (_err) {
      allowedDepartments = body.allowedDepartments
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
    }
  }

  return {
    title,
    description,
    accessLevel,
    allowedDepartments,
  };
}

module.exports = {
  validateDocumentMetadata,
};

