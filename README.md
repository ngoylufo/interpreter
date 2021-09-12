# Spreadsheet Formula Interpreter

A very basic spreadsheet formula interpreter.

## Running the project

Just clone the repo and install the dependencies.

```sh
yarn # or npm install
yarn dev # or npm run dev
```

The project comes with a very bare bones interactive shell. Having ran the `dev`
command, you should see a prompt that loops like this:

```sh
(SFI) $ 
```

### Formulas

You can enter formulas you wish to execute, note however this isn't feature
complete and only has two cells (A1 and A2) available. Any input that starts
with an "=" symbol, is interpreted as a formula. Any other input is just
seen a text (or a string internally).

```sh
(SFI) $ SUM(A2, 22, 44)
SUM(A2, 22, 44)
```

Examples pre-pended with an "=" symbol.

```sh
(SFI) $ =SUM(A2, 22, 44)
88
(SFI) $ =A1
Hello
(SFI) $ =LEN(A1)
5
```