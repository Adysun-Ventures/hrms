/** Folder of a glob key: './app/employees/[id]/page.tsx' -> './app/employees/[id]'. */
export const dirOf = (file: string) => file.slice(0, file.lastIndexOf('/'));

/** Page folder -> React Router path: './app/employees/[id]' -> '/employees/:id', './app' -> '/'. */
export const toRoutePath = (dir: string) => dir.replace('./app', '').replace(/\[(\w+)\]/g, ':$1') || '/';
