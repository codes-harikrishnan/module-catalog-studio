import archiver from "archiver";

export async function sendZip(res, zipName, files){
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => res.status(500).send(String(err)));
  archive.pipe(res);

  for (const [path, content] of Object.entries(files)) {
    archive.append(content, { name: path });
  }
  await archive.finalize();
}
