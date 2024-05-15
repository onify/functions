import { spawn } from 'child_process';

console.log('hello');

const child = spawn('npm', ['run', 'vitest']);

child.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

child.on('error', (error) => {
  console.error('Failed to start subprocess.');
});

child.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
