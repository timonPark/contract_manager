import { IsNotEmpty, ArrayNotEmpty } from 'class-validator';

export class RegistContractReqDto {
  @IsNotEmpty()
  private _bucket: string;
  @IsNotEmpty()
  private _signKey: string;
  @ArrayNotEmpty()
  private _contract: Contract[];

  get bucket(): string {
    return this._bucket;
  }

  get signKey(): string {
    return this._signKey;
  }

  get contract(): Contract[] {
    return this._contract;
  }
}

export class Contract {
  @IsNotEmpty()
  private _fileName: string;
  @ArrayNotEmpty()
  private _dataBinding: DataBinding[];
  private _signPoint: SignPoint;
  @IsNotEmpty()
  private _readKey: string;
  @IsNotEmpty()
  private _writeKey: string;

  get fileName(): string {
    return this._fileName;
  }

  get dataBinding(): DataBinding[] {
    return this._dataBinding;
  }

  get signPoint(): SignPoint {
    return this._signPoint;
  }

  get readKey(): string {
    return this._readKey;
  }

  get writeKey(): string {
    return this._writeKey;
  }
}

export class DataBinding {
  @IsNotEmpty()
  private _targetPoint: string;
  @IsNotEmpty()
  private _targetValue: string;

  get targetPoint(): string {
    return this._targetPoint;
  }

  get targetValue(): string {
    return this._targetValue;
  }
}

export class SignPoint {
  @IsNotEmpty()
  private _x: number;
  @IsNotEmpty()
  private _y: number;

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }
}
