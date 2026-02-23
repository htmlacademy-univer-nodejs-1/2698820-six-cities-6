declare module 'convict-format-with-validator' {
  type ConvictFormat = {
    name: string;
    coerce?: (value: unknown) => unknown;
    validate: (value: unknown) => void;
  };

  type ValidatorFormats = {
    email: ConvictFormat;
    ipaddress: ConvictFormat;
    url: ConvictFormat;
  };

  const formats: ValidatorFormats;
  export default formats;
}
