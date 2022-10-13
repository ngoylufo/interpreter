export default class Channel<T> {
	private buffer: T[] = [];
	private peeker: ((data: T) => void) | undefined;
	private popper: ((data: T) => void) | undefined;
	private closed: boolean = false;

	get receiving() {
		return this.buffer.length > 0 || this.closed === false;
	}

	close() {
		this.closed = true;
	}

	async push(data: T) {
		if (this.closed) {
			throw new Error("cannot push channel closed");
		}
		this.buffer.push(data);

		if (this.peeker) {
			this.peeker(this.buffer[0]);
		}

		if (this.popper) {
			this.popper(this.buffer.shift()!);
		}
	}

	async pop() {
		if (this.closed && this.buffer.length === 0) {
			throw new Error("cannot pop channel closed");
		}

		if (this.buffer.length) {
			return this.buffer.shift()!;
		}
		const promise = new Promise<T>((resolve) => {
			this.popper = (data: T) => (this.popper = void resolve(data));
		});
		return promise;
	}

	async peek() {
		if (this.closed && this.buffer.length === 0) {
			throw new Error("cannot peek channel closed");
		}
		if (this.buffer.length) {
			return this.buffer[0];
		}
		const promise = new Promise<T>((resolve) => {
			this.peeker = (data: T) => (this.peeker = void resolve(data));
		});
		return promise;
	}
}
