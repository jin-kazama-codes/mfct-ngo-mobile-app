const fs = require('fs');
const path = require('path');
const {
  withInfoPlist,
  withProjectBuildGradle,
  withDangerousMod,
} = require('expo/config-plugins');

const UPI_QUERY_SCHEMES = ['tez', 'phonepe', 'paytmmp', 'bhim', 'credpay'];

const PROGUARD_MARKER = '# Razorpay SDK keep rules';
const PROGUARD_RULES = `
${PROGUARD_MARKER}
-keepattributes *Annotation*
-dontwarn com.razorpay.**
-keep class com.razorpay.** {*;}
-keepclasseswithmembers class * {
  public void onPayment*(...);
}
`;

const GRADLE_MARKER = '// withRazorpay AGP namespace fallback';
const GRADLE_NAMESPACE_SNIPPET = `
${GRADLE_MARKER}
subprojects { subproject ->
  if (subproject.name == 'react-native-razorpay') {
    subproject.plugins.withId('com.android.library') {
      if (subproject.hasProperty('android') && subproject.android.namespace == null) {
        subproject.android.namespace = 'com.razorpay.rn'
      }
    }
  }
}
`;

function withRazorpayIosSchemes(config) {
  return withInfoPlist(config, (cfg) => {
    const existing = Array.isArray(cfg.modResults.LSApplicationQueriesSchemes)
      ? cfg.modResults.LSApplicationQueriesSchemes
      : [];
    const merged = [...existing];
    for (const scheme of UPI_QUERY_SCHEMES) {
      if (!merged.includes(scheme)) {
        merged.push(scheme);
      }
    }
    cfg.modResults.LSApplicationQueriesSchemes = merged;
    return cfg;
  });
}

function withRazorpayAndroidNamespace(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language === 'groovy') {
      const contents = cfg.modResults.contents || '';
      if (!contents.includes(GRADLE_MARKER)) {
        cfg.modResults.contents = `${contents}\n${GRADLE_NAMESPACE_SNIPPET}`;
      }
    }
    return cfg;
  });
}

function withRazorpayProguard(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const proguardPath = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );
      let existing = '';
      if (fs.existsSync(proguardPath)) {
        existing = fs.readFileSync(proguardPath, 'utf8');
      }
      if (!existing.includes(PROGUARD_MARKER)) {
        fs.writeFileSync(proguardPath, `${existing.trimEnd()}\n${PROGUARD_RULES}`, 'utf8');
      }
      return cfg;
    },
  ]);
}

module.exports = function withRazorpay(config) {
  config = withRazorpayIosSchemes(config);
  config = withRazorpayAndroidNamespace(config);
  config = withRazorpayProguard(config);
  return config;
};

