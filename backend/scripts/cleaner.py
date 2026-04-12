import sys
import pandas as pd
import numpy as np
import json
import os
import traceback

def clean_data(file_path, original_name=None):
    try:
        # Determine file type
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file_path)
        else:
            raise ValueError("Unsupported file format. Please upload CSV or Excel.")

        # Capture initial stats
        original_rows = len(df)
        nulls_before = df.isnull().sum().to_dict()

        # Basic Cleaning Steps
        # 1. Rename columns (clean format)
        df.columns = [c.lower().replace(" ", "_").strip() for c in df.columns]

        # 2. Drop completely empty rows
        df.dropna(how='all', inplace=True)
        
        # 3. Drop duplicate rows
        rows_before_dedup = len(df)
        df.drop_duplicates(inplace=True)
        duplicates_removed = rows_before_dedup - len(df)
        
        # 4. Fill missing numeric values (if any) with median
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if df[col].isnull().any():
                df[col] = df[col].fillna(df[col].median())
                
        # 5. Fill missing categorical values (if any) with mode
        cat_cols = df.select_dtypes(include="object").columns
        for col in cat_cols:
            if df[col].isnull().any():
                mode_val = df[col].mode()
                if not mode_val.empty:
                    df[col] = df[col].fillna(mode_val[0])
                else:
                    df[col] = df[col].fillna("Unknown")

        # Capture final stats
        nulls_after = df.isnull().sum().to_dict()
        final_rows = len(df)

        # Generate output file path
        directory, _ = os.path.split(file_path)
        if original_name:
            name, _ = os.path.splitext(original_name)
        else:
            _, filename = os.path.split(file_path)
            name, _ = os.path.splitext(filename)
            
        output_filename = f"cleaned_{name}.csv"
        output_path = os.path.join(directory, output_filename)
        
        # Always output as clean CSV for dashboard ingestion
        df.to_csv(output_path, index=False)
        
        # Return success JSON to stdout for Node.js to read
        result = {
            "success": True,
            "message": "Data cleaned successfully",
            "original_rows": original_rows,
            "final_rows": final_rows,
            "stats": {
                "original_rows": original_rows,
                "final_rows": final_rows,
                "duplicates_removed": duplicates_removed,
                "nulls_before": nulls_before,
                "nulls_after": nulls_after
            },
            "output_file": output_filename, # Send just the filename to construct URL in node
            "path": output_path
        }
        print(json.dumps(result))

    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "trace": traceback.format_exc()
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file path provided"}))
        sys.exit(1)
        
    input_file = sys.argv[1]
    orig_name = sys.argv[2] if len(sys.argv) > 2 else None
    clean_data(input_file, orig_name)
