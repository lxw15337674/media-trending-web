export function printJsonPayload(payload: unknown) {
  console.log(JSON.stringify(payload, null, 2));
}

export function exitIfFailures(failedCount: number) {
  if (failedCount > 0) {
    process.exit(1);
  }
}
