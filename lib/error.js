
class ApiError extends Error {
  constructor (error) {
    super(error.message)
    this.status = error.status
    this.detail = error
  }
}

export { ApiError }
