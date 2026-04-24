export const queryAll = async <T>(statement: D1PreparedStatement): Promise<T[]> => {
  const result = await statement.all<T>()
  return result.results ?? []
}

export const queryFirst = async <T>(statement: D1PreparedStatement): Promise<T | null> => {
  return (await statement.first<T>()) ?? null
}

export const execute = async (statement: D1PreparedStatement) => {
  await statement.run()
}

export const nowIso = () => new Date().toISOString()

export const plusSecondsIso = (seconds: number) => new Date(Date.now() + seconds * 1000).toISOString()
